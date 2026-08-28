from django.db import migrations


def copiar_propietarios(apps, schema_editor):
    Riesgo = apps.get_model('riesgos', 'Riesgo')
    for riesgo in Riesgo.objects.exclude(propietario_riesgo__isnull=True):
        riesgo.propietarios_riesgo.add(riesgo.propietario_riesgo_id)


def revertir(apps, schema_editor):
    # No hace falta deshacer nada: el campo FK original no se toca en esta migración.
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('riesgos', '0014_riesgo_propietarios_riesgo'),
    ]

    operations = [
        migrations.RunPython(copiar_propietarios, revertir),
    ]
