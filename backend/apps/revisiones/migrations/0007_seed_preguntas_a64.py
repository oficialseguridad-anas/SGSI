from django.db import migrations

CONTROL_CODIGO = 'A.6.4'
CONTROL_NOMBRE = 'Proceso disciplinario'

PREGUNTAS = [
    (1, '¿Existe un proceso disciplinario formal y comunicado?'),
    (2, '¿El Reglamento Interno u otro instrumento contempla incumplimientos relacionados con seguridad de la información?'),
    (3, '¿Existe conexión entre reporte/investigación de incidentes y eventual proceso disciplinario?'),
    (4, '¿Se garantizan criterios de proporcionalidad, intencionalidad y debido proceso?'),
    (5, '¿Los colaboradores conocen que el incumplimiento de políticas puede generar acciones disciplinarias?'),
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
        ('revisiones', '0006_seed_preguntas_a63'),
    ]

    operations = [
        migrations.RunPython(poblar, revertir),
    ]
