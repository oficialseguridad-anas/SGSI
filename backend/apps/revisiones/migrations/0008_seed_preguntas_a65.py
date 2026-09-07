from django.db import migrations

CONTROL_CODIGO = 'A.6.5'
CONTROL_NOMBRE = 'Responsabilidades tras el cese o cambio de empleo'

PREGUNTAS = [
    (1, '¿Existe comunicación formal del retiro o cambio de cargo?'),
    (2, '¿Se completó paz y salvo o mecanismo equivalente?'),
    (3, '¿Se devolvieron los activos asignados?'),
    (4, '¿Las cuentas y accesos fueron deshabilitados o ajustados oportunamente?'),
    (5, '¿Se retiraron accesos remotos/VPN y privilegios?'),
    (6, '¿Se realizó respaldo o transferencia de información de trabajo cuando correspondía?'),
    (7, '¿Se transfirieron responsabilidades y conocimiento crítico?'),
    (8, '¿Las obligaciones de confidencialidad continúan vigentes después del retiro?'),
]


def poblar(apps, schema_editor):
    PreguntaChecklistPersonas = apps.get_model('revisiones', 'PreguntaChecklistPersonas')
    RespuestaChecklistPersonas = apps.get_model('revisiones', 'RespuestaChecklistPersonas')
    RevisionPersonas = apps.get_model('revisiones', 'RevisionPersonas')

    preguntas_creadas = []
    for numero, texto in PREGUNTAS:
        pregunta, _ = PreguntaChecklistPersonas.objects.get_or_create(
            control_codigo=CONTROL_CODIGO,
            numero=numero,
            defaults={'control_nombre': CONTROL_NOMBRE, 'texto': texto},
        )
        preguntas_creadas.append(pregunta)

    for revision in RevisionPersonas.objects.all():
        for pregunta in preguntas_creadas:
            RespuestaChecklistPersonas.objects.get_or_create(revision=revision, pregunta=pregunta)


def revertir(apps, schema_editor):
    PreguntaChecklistPersonas = apps.get_model('revisiones', 'PreguntaChecklistPersonas')
    PreguntaChecklistPersonas.objects.filter(control_codigo=CONTROL_CODIGO).delete()


class Migration(migrations.Migration):
    dependencies = [
        ('revisiones', '0007_seed_preguntas_a64'),
    ]

    operations = [
        migrations.RunPython(poblar, revertir),
    ]
