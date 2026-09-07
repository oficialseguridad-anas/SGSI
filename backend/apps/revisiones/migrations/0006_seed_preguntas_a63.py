from django.db import migrations

CONTROL_CODIGO = 'A.6.3'
CONTROL_NOMBRE = 'Sensibilización, educación y formación'

PREGUNTAS = [
    (1, '¿Existe evidencia de inducción en seguridad de la información?'),
    (2, '¿La inducción cubre políticas, uso aceptable, contraseñas, incidentes, protección de datos y responsabilidades?'),
    (3, '¿La persona recibió capacitación posterior durante el periodo evaluado?'),
    (4, '¿Se conserva evidencia del contenido impartido y de la asistencia?'),
    (5, '¿Se evaluó la comprensión o transferencia de conocimiento?'),
    (6, '¿La formación es diferenciada o reforzada para roles con privilegios o riesgos especiales?'),
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
        ('revisiones', '0005_seed_preguntas_a62'),
    ]

    operations = [
        migrations.RunPython(poblar, revertir),
    ]
