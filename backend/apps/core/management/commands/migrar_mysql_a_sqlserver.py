"""
Copia los datos existentes en MySQL hacia SQL Server (destino final del proyecto).

Requisitos antes de ejecutar:
  1. El contenedor de SQL Server debe estar corriendo (docker compose up -d) y con la
     base de datos ya creada (el propio docker-compose.yml se encarga de crearla).
  2. backend/.env debe tener DB_ENGINE=mssql (para que Django apunte al destino) y
     las variables LEGACY_MYSQL_* con las credenciales del MySQL de origen.
  3. `python manage.py migrate` debe haberse corrido ya contra SQL Server, para que
     existan las tablas vacías donde insertar los datos.

Uso:
    python manage.py migrar_mysql_a_sqlserver
    python manage.py migrar_mysql_a_sqlserver --dry-run   # solo cuenta filas, no escribe nada

No se migran (son datos operativos/efímeros, no información de negocio):
  BitacoraAcceso, BitacoraAccion, CodigoRecuperacionOtp, CodigoOtpCorreo,
  sesiones de Django, lista negra de tokens JWT, ContentType/Permission
  (Django los regenera solos al correr migrate).

Nota: los campos con auto_now/auto_now_add (creado_en, actualizado_en,
fecha_asignacion) quedan con la fecha/hora original gracias a un segundo paso
con bulk_update, que no dispara la lógica de "auto_now" de Django.
"""

import datetime
import os

import pymysql
from django.contrib.auth.models import Group
from django.core.management.base import BaseCommand, CommandError
from django.db import connection, transaction

from apps.accounts.models import Rol, Usuario, UsuarioRol
from apps.activos.models import Activo, Direccion, Proceso
from apps.documentos.models import Documento, VersionDocumento
from apps.riesgos.models import Amenaza, Riesgo, TratamientoRiesgo, Vulnerabilidad


def _conectar_mysql_origen():
    faltantes = [
        var for var in ('LEGACY_MYSQL_HOST', 'LEGACY_MYSQL_NAME', 'LEGACY_MYSQL_USER', 'LEGACY_MYSQL_PASSWORD')
        if not os.environ.get(var)
    ]
    if faltantes:
        raise CommandError(
            f'Faltan variables de entorno para conectar al MySQL de origen: {", ".join(faltantes)}'
        )
    return pymysql.connect(
        host=os.environ['LEGACY_MYSQL_HOST'],
        port=int(os.environ.get('LEGACY_MYSQL_PORT', 3306)),
        user=os.environ['LEGACY_MYSQL_USER'],
        password=os.environ['LEGACY_MYSQL_PASSWORD'],
        database=os.environ['LEGACY_MYSQL_NAME'],
        cursorclass=pymysql.cursors.DictCursor,
    )


def _leer_filas(cursor_mysql, modelo):
    tabla = modelo._meta.db_table
    cursor_mysql.execute(f'SELECT * FROM `{tabla}` ORDER BY id')
    return cursor_mysql.fetchall()


def _valor_consciente_de_zona(valor):
    """pymysql devuelve datetimes 'naive' con la hora física guardada (UTC, porque
    USE_TZ=True hace que Django guarde en UTC). Sin marcar tzinfo=UTC explícitamente,
    Django reinterpreta un datetime naive como hora local (TIME_ZONE) y lo desplaza
    al convertirlo, corriendo el valor varias horas."""
    if isinstance(valor, datetime.datetime) and valor.tzinfo is None:
        return valor.replace(tzinfo=datetime.timezone.utc)
    return valor


def _construir_objetos(modelo, filas):
    campos = modelo._meta.concrete_fields
    return [
        modelo(**{campo.attname: _valor_consciente_de_zona(fila[campo.column]) for campo in campos})
        for fila in filas
    ]


def _insertar_preservando_pk(modelo, objetos):
    """Inserta objetos ya instanciados conservando su PK original (requiere
    IDENTITY_INSERT en SQL Server) y luego restaura los campos auto_now/auto_now_add
    a su valor original (bulk_create los sobrescribe con la fecha/hora actual mediante
    Field.pre_save, que además hace setattr sobre el propio objeto en memoria; por eso
    hay que guardar el valor original ANTES del insert, no después)."""
    if not objetos:
        return
    tabla = modelo._meta.db_table
    campos_fecha = [
        campo.name for campo in modelo._meta.concrete_fields
        if getattr(campo, 'auto_now', False) or getattr(campo, 'auto_now_add', False)
    ]
    originales = [{campo: getattr(obj, campo) for campo in campos_fecha} for obj in objetos]

    with connection.cursor() as cursor:
        cursor.execute(f'SET IDENTITY_INSERT [{tabla}] ON')
    try:
        modelo.objects.bulk_create(objetos)
    finally:
        with connection.cursor() as cursor:
            cursor.execute(f'SET IDENTITY_INSERT [{tabla}] OFF')

    if campos_fecha:
        for obj, valores in zip(objetos, originales):
            for campo, valor in valores.items():
                setattr(obj, campo, valor)
        modelo.objects.bulk_update(objetos, campos_fecha)


class Command(BaseCommand):
    help = 'Migra los datos de negocio desde MySQL (origen) hacia SQL Server (destino, DATABASES["default"]).'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run', action='store_true',
            help='Solo cuenta cuántas filas hay en el origen, no escribe nada en el destino.',
        )

    def handle(self, *args, **options):
        if connection.vendor != 'microsoft' and not options['dry_run']:
            raise CommandError(
                'DATABASES["default"] no apunta a SQL Server. Pon DB_ENGINE=mssql en backend/.env '
                'y corre "python manage.py migrate" antes de migrar los datos.'
            )

        mysql_conn = _conectar_mysql_origen()
        cursor_mysql = mysql_conn.cursor()

        pasos = [
            ('Grupos', Group),
            ('Roles', Rol),
            ('Usuarios', Usuario),
            ('Usuario-Rol', UsuarioRol),
            ('Usuario-Grupos (M2M)', Usuario.groups.through),
            ('Usuario-Permisos (M2M)', Usuario.user_permissions.through),
            ('Procesos', Proceso),
            ('Direcciones', Direccion),
            ('Activos', Activo),
            # 'Controles Anexo A' y 'Declaraciones de aplicabilidad (SoA)' no se migran:
            # la migración de datos 0002_seed_controles_anexo_a ya crea ambos con los
            # mismos ids y valores por defecto en cualquier base nueva al correr
            # "migrate" (se verificó que en el origen las 93 filas de SoA seguían en
            # sus valores por defecto, sin edición real que se pudiera perder).
            ('Amenazas', Amenaza),
            ('Vulnerabilidades', Vulnerabilidad),
            ('Riesgos', Riesgo),
            ('Riesgo-Controles (M2M)', Riesgo.controles.through),
            ('Tratamientos de riesgo', TratamientoRiesgo),
            ('Documentos', Documento),
            ('Versiones de documento', VersionDocumento),
        ]

        try:
            with transaction.atomic():
                for etiqueta, modelo in pasos:
                    filas = _leer_filas(cursor_mysql, modelo)
                    if options['dry_run']:
                        self.stdout.write(f'{etiqueta}: {len(filas)} fila(s) en el origen')
                        continue
                    objetos = _construir_objetos(modelo, filas)
                    _insertar_preservando_pk(modelo, objetos)
                    self.stdout.write(self.style.SUCCESS(f'{etiqueta}: {len(objetos)} fila(s) migrada(s)'))
                if options['dry_run']:
                    transaction.set_rollback(True)
        finally:
            cursor_mysql.close()
            mysql_conn.close()

        if not options['dry_run']:
            self.stdout.write(self.style.SUCCESS('Migración completada.'))
            self.stdout.write(
                'No se migraron (operativos/efímeros): BitacoraAcceso, BitacoraAccion, '
                'CodigoRecuperacionOtp, CodigoOtpCorreo, sesiones, lista negra de tokens JWT.'
            )
