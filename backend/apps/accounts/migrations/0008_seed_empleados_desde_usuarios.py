from django.db import migrations


def poblar(apps, schema_editor):
    Usuario = apps.get_model('accounts', 'Usuario')
    Empleado = apps.get_model('accounts', 'Empleado')
    for usuario in Usuario.objects.filter(empleado__isnull=True):
        empleado = Empleado.objects.create(
            nombre_completo=usuario.nombre_completo,
            cargo=usuario.cargo,
            correo=usuario.email,
            activo=usuario.is_active,
        )
        usuario.empleado = empleado
        usuario.save(update_fields=['empleado'])


def revertir(apps, schema_editor):
    # No se borran los Empleado al revertir: pueden ya estar referenciados desde otros
    # módulos (ej. Revisión por la Dirección) para cuando esta migración se revierta.
    pass


class Migration(migrations.Migration):
    dependencies = [
        ('accounts', '0007_empleado_usuario_empleado'),
    ]

    operations = [
        migrations.RunPython(poblar, revertir),
    ]
