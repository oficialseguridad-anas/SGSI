from django.db import migrations

PROCESOS = [
    'Tecnología',
    'Administrativa y Financiera',
    'Gestión Humana',
    'Gestión de la Calidad y Riesgos',
    'Comunicaciones',
]


def poblar(apps, schema_editor):
    """Siembra los Procesos referenciados por los hallazgos de auditoría: el catálogo
    Proceso estaba vacío antes de que el módulo de Auditorías pasara a relacionarse
    directamente con Proceso (en vez de Dirección)."""
    Proceso = apps.get_model('activos', 'Proceso')
    for nombre in PROCESOS:
        Proceso.objects.get_or_create(nombre=nombre)


def revertir(apps, schema_editor):
    Proceso = apps.get_model('activos', 'Proceso')
    Proceso.objects.filter(nombre__in=PROCESOS).delete()


class Migration(migrations.Migration):
    dependencies = [
        ('activos', '0009_seed_direcciones_hallazgos'),
    ]

    operations = [
        migrations.RunPython(poblar, revertir),
    ]
