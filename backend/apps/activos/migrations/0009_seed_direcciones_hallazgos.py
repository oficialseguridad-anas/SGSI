from django.db import migrations

DIRECCIONES = [
    ('TEC', 'Tecnología'),
    ('AYF', 'Administrativa y Financiera'),
    ('GTH', 'Gestión Humana'),
    ('GCR', 'Gestión de la Calidad y Riesgos'),
    ('COM', 'Comunicaciones'),
]


def poblar(apps, schema_editor):
    """Siembra las Direcciones referenciadas por los hallazgos de auditoría existentes:
    el catálogo Proceso/Dirección estaba vacío antes de crear el módulo de Auditorías."""
    Direccion = apps.get_model('activos', 'Direccion')
    for codigo, nombre in DIRECCIONES:
        Direccion.objects.get_or_create(nombre=nombre, defaults={'codigo': codigo, 'proceso': None})


def revertir(apps, schema_editor):
    Direccion = apps.get_model('activos', 'Direccion')
    Direccion.objects.filter(nombre__in=[nombre for _, nombre in DIRECCIONES]).delete()


class Migration(migrations.Migration):
    dependencies = [
        ('activos', '0008_camel_case_db'),
    ]

    operations = [
        migrations.RunPython(poblar, revertir),
    ]
