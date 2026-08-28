from django.db import migrations


def copiar_responsables(apps, schema_editor):
    TratamientoRiesgo = apps.get_model('riesgos', 'TratamientoRiesgo')
    for tratamiento in TratamientoRiesgo.objects.exclude(responsable__isnull=True):
        tratamiento.responsables.add(tratamiento.responsable_id)


def revertir(apps, schema_editor):
    # No hace falta deshacer nada: el campo FK original no se toca en esta migración.
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('riesgos', '0017_tratamientoriesgo_responsables'),
    ]

    operations = [
        migrations.RunPython(copiar_responsables, revertir),
    ]
