from django.db import migrations

CONTROL_CODIGO = 'A.6.1'
CONTROL_NOMBRE = 'Selección'

PREGUNTAS = [
    (1, '¿Existe un perfil de cargo vigente con requisitos de formación, experiencia y competencias?'),
    (2, '¿La persona seleccionada cumple los requisitos definidos en el perfil?'),
    (3, '¿Se verificó la identidad del candidato?'),
    (4, '¿Se verificaron títulos, certificados académicos y experiencia declarada, según aplique?'),
    (5, '¿Se verificaron referencias laborales?'),
    (6, '¿Existen soportes de antecedentes disciplinarios, judiciales, policiales u otros definidos?'),
    (7, '¿Las verificaciones fueron realizadas antes de la vinculación?'),
    (8, '¿La profundidad de la verificación es proporcional a la criticidad del cargo y al acceso a información sensible?'),
    (9, '¿Existe evidencia de verificaciones periódicas adicionales cuando el rol lo exige?'),
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
        ('revisiones', '0002_preguntachecklistpersonas_respuestachecklistpersonas'),
    ]

    operations = [
        migrations.RunPython(poblar, revertir),
    ]
