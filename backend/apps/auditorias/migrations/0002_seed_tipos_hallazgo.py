from django.db import migrations

TIPOS = [
    ('NC', 'No conformidad'),
    ('AM', 'Acción de mejora'),
]


def poblar(apps, schema_editor):
    TipoHallazgo = apps.get_model('auditorias', 'TipoHallazgo')
    for codigo, nombre in TIPOS:
        TipoHallazgo.objects.get_or_create(codigo=codigo, defaults={'nombre': nombre})


def revertir(apps, schema_editor):
    TipoHallazgo = apps.get_model('auditorias', 'TipoHallazgo')
    TipoHallazgo.objects.filter(codigo__in=[codigo for codigo, _ in TIPOS]).delete()


class Migration(migrations.Migration):
    dependencies = [
        ('auditorias', '0001_initial'),
    ]

    operations = [
        migrations.RunPython(poblar, revertir),
    ]
