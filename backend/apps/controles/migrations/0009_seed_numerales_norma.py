from django.db import migrations

NUMERALES = [
    ('4.1', 'Comprensión de la organización y su contexto', '4. Contexto de la organización'),
    ('4.2', 'Comprensión de las necesidades y expectativas de las partes interesadas', '4. Contexto de la organización'),
    ('4.3', 'Determinación del alcance del sistema de gestión de seguridad de la información', '4. Contexto de la organización'),
    ('4.4', 'Sistema de gestión de seguridad de la información', '4. Contexto de la organización'),
    ('5.1', 'Liderazgo y compromiso', '5. Liderazgo'),
    ('5.2', 'Política', '5. Liderazgo'),
    ('5.3', 'Roles, responsabilidades y autoridades en la organización', '5. Liderazgo'),
    ('6.1', 'Acciones para abordar los riesgos y las oportunidades', '6. Planificación'),
    ('6.1.1', 'Generalidades', '6. Planificación'),
    ('6.1.2', 'Valoración de riesgos de seguridad de la información', '6. Planificación'),
    ('6.1.3', 'Tratamiento de los riesgos de seguridad de la información', '6. Planificación'),
    ('6.2', 'Objetivos de seguridad de la información y planificación para lograrlos', '6. Planificación'),
    ('6.3', 'Planificación de cambios', '6. Planificación'),
    ('7.1', 'Recursos', '7. Apoyo'),
    ('7.2', 'Competencia', '7. Apoyo'),
    ('7.3', 'Toma de conciencia', '7. Apoyo'),
    ('7.4', 'Comunicación', '7. Apoyo'),
    ('7.5', 'Información documentada', '7. Apoyo'),
    ('7.5.1', 'Generalidades', '7. Apoyo'),
    ('7.5.2', 'Creación y actualización', '7. Apoyo'),
    ('7.5.3', 'Control de la información documentada', '7. Apoyo'),
    ('8.1', 'Planificación y control operacional', '8. Operación'),
    ('8.2', 'Valoración de riesgos de seguridad de la información', '8. Operación'),
    ('8.3', 'Tratamiento de los riesgos de seguridad de la información', '8. Operación'),
    ('9.1', 'Seguimiento, medición, análisis y evaluación', '9. Evaluación del desempeño'),
    ('9.2', 'Auditoría interna', '9. Evaluación del desempeño'),
    ('9.2.1', 'Generalidades', '9. Evaluación del desempeño'),
    ('9.2.2', 'Programa de auditoría interna', '9. Evaluación del desempeño'),
    ('9.3', 'Revisión por la dirección', '9. Evaluación del desempeño'),
    ('9.3.1', 'Generalidades', '9. Evaluación del desempeño'),
    ('9.3.2', 'Entradas de la revisión por la dirección', '9. Evaluación del desempeño'),
    ('9.3.3', 'Resultados de la revisión por la dirección', '9. Evaluación del desempeño'),
    ('10.1', 'Mejora continua', '10. Mejora'),
    ('10.2', 'No conformidad y acción correctiva', '10. Mejora'),
]


def poblar(apps, schema_editor):
    NumeralNorma = apps.get_model('controles', 'NumeralNorma')
    for codigo, nombre, capitulo in NUMERALES:
        NumeralNorma.objects.get_or_create(codigo=codigo, defaults={'nombre': nombre, 'capitulo': capitulo})


def revertir(apps, schema_editor):
    NumeralNorma = apps.get_model('controles', 'NumeralNorma')
    NumeralNorma.objects.filter(codigo__in=[codigo for codigo, _, _ in NUMERALES]).delete()


class Migration(migrations.Migration):
    dependencies = [
        ('controles', '0008_numeralnorma'),
    ]

    operations = [
        migrations.RunPython(poblar, revertir),
    ]
