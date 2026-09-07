from django.db import migrations

CONTROL_CODIGO = 'A.6.2'
CONTROL_NOMBRE = 'Condiciones del empleo'

PREGUNTAS = [
    (1, '¿El contrato o acuerdo establece responsabilidades de seguridad de la información?'),
    (2, '¿Se incluyen obligaciones sobre tratamiento y protección de información?'),
    (3, '¿Se indican consecuencias o responsabilidades por incumplimiento?'),
    (4, '¿El colaborador recibió o aceptó las políticas aplicables antes o al inicio de sus funciones?'),
    (5, '¿Las condiciones son coherentes con el tipo de contratación y nivel de acceso?'),
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

    # Si ya existían revisiones antes de agregar este control al catálogo, les crea la
    # respuesta en blanco correspondiente (para que también vean el checklist completo).
    for revision in RevisionPersonas.objects.all():
        for pregunta in preguntas_creadas:
            RespuestaChecklistPersonas.objects.get_or_create(revision=revision, pregunta=pregunta)


def revertir(apps, schema_editor):
    PreguntaChecklistPersonas = apps.get_model('revisiones', 'PreguntaChecklistPersonas')
    PreguntaChecklistPersonas.objects.filter(control_codigo=CONTROL_CODIGO).delete()


class Migration(migrations.Migration):
    dependencies = [
        ('revisiones', '0004_revisionpersonas_finalizada'),
    ]

    operations = [
        migrations.RunPython(poblar, revertir),
    ]
