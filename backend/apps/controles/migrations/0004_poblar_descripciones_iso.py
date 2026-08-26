# -*- coding: utf-8 -*-
"""Puebla Control.descripcion con el texto de control de ISO/IEC 27002:2022 Anexo A.

El texto es una redacción basada en el conocimiento general de la norma (mejor
esfuerzo), no una copia certificada del documento oficial. Se recomienda que el
Oficial de Seguridad la verifique contra la copia licenciada de la organización
antes de usarla como evidencia formal en una auditoría.
"""
from django.db import migrations

DESCRIPCIONES = {
    '5.1': 'La política de seguridad de la información y las políticas de temas específicos deben ser '
           'definidas, aprobadas por la dirección, publicadas, comunicadas y reconocidas por el personal y '
           'las partes interesadas pertinentes, y revisadas a intervalos planificados y si se producen '
           'cambios significativos.',
    '5.2': 'Los roles y responsabilidades de seguridad de la información se deben definir y asignar de '
           'acuerdo con las necesidades de la organización.',
    '5.3': 'Las funciones y las áreas de responsabilidad conflictivas deben estar separadas.',
    '5.4': 'La dirección debe exigir a todo el personal que aplique la seguridad de la información de '
           'acuerdo con la política de seguridad de la información establecida, las políticas y los '
           'procedimientos específicos de cada tema de la organización.',
    '5.5': 'La organización debe establecer y mantener contacto con las autoridades pertinentes.',
    '5.6': 'La organización debe establecer y mantener contacto con grupos de interés especial u otros '
           'foros y asociaciones profesionales especializados en seguridad.',
    '5.7': 'Se debe recopilar y analizar información relacionada con amenazas a la seguridad de la '
           'información, para producir inteligencia de amenazas.',
    '5.8': 'La seguridad de la información se debe integrar en la gestión de proyectos.',
    '5.9': 'Se debe desarrollar y mantener un inventario de la información y otros activos asociados, '
           'incluidos sus propietarios.',
    '5.10': 'Se deben identificar, documentar e implementar reglas para el uso aceptable y '
            'procedimientos para el manejo de la información y otros activos asociados.',
    '5.11': 'El personal y otras partes interesadas, según corresponda, deben devolver todos los '
            'activos de la organización que tengan en su posesión al finalizar su empleo, contrato o acuerdo.',
    '5.12': 'La información se debe clasificar de acuerdo con las necesidades de seguridad de la '
            'información de la organización, con base en la confidencialidad, integridad, disponibilidad y '
            'los requisitos de las partes interesadas pertinentes.',
    '5.13': 'Se debe desarrollar e implementar un conjunto adecuado de procedimientos para el etiquetado '
            'de la información, de acuerdo con el esquema de clasificación de la información adoptado por '
            'la organización.',
    '5.14': 'Se deben establecer reglas, procedimientos o acuerdos de transferencia de información para '
            'todo tipo de instalaciones de transferencia dentro de la organización y entre la organización '
            'y otras partes.',
    '5.15': 'Se deben establecer e implementar reglas para controlar el acceso físico y lógico a la '
            'información y otros activos asociados, con base en los requisitos del negocio y de seguridad '
            'de la información.',
    '5.16': 'Se debe gestionar el ciclo de vida completo de las identidades.',
    '5.17': 'La asignación y gestión de la información de autenticación se debe controlar mediante un '
            'proceso de gestión, incluido el asesoramiento al personal sobre el manejo adecuado de la '
            'información de autenticación.',
    '5.18': 'Los derechos de acceso a la información y otros activos asociados se deben otorgar, revisar, '
            'modificar y eliminar de acuerdo con la política y las reglas de la organización sobre control '
            'de acceso.',
    '5.19': 'Se deben definir e implementar procesos y procedimientos para gestionar los riesgos de '
            'seguridad de la información asociados con el uso de los productos o servicios de los '
            'proveedores.',
    '5.20': 'Se deben establecer y acordar con cada proveedor los requisitos pertinentes de seguridad de '
            'la información, con base en el tipo de relación con el proveedor.',
    '5.21': 'Se deben definir e implementar procesos y procedimientos para gestionar los riesgos de '
            'seguridad de la información asociados con la cadena de suministro de productos y servicios '
            'de TIC.',
    '5.22': 'La organización debe monitorear, revisar, evaluar y gestionar regularmente los cambios en '
            'las prácticas de seguridad de la información de los proveedores y en la prestación de '
            'servicios.',
    '5.23': 'Se deben establecer procesos para la adquisición, uso, gestión y salida de servicios en la '
            'nube, de acuerdo con los requisitos de seguridad de la información de la organización.',
    '5.24': 'La organización debe planificar y prepararse para gestionar los incidentes de seguridad de '
            'la información, definiendo, estableciendo y comunicando los procesos, roles y '
            'responsabilidades de gestión de incidentes.',
    '5.25': 'La organización debe evaluar los eventos de seguridad de la información y decidir si se '
            'deben clasificar como incidentes de seguridad de la información.',
    '5.26': 'Los incidentes de seguridad de la información se deben gestionar de acuerdo con los '
            'procedimientos documentados.',
    '5.27': 'El conocimiento adquirido a partir de los incidentes de seguridad de la información se debe '
            'utilizar para fortalecer y mejorar los controles de seguridad de la información.',
    '5.28': 'La organización debe establecer e implementar procedimientos para la identificación, '
            'recopilación, adquisición y preservación de evidencia relacionada con eventos de seguridad de '
            'la información.',
    '5.29': 'La organización debe planificar cómo mantener la seguridad de la información en un nivel '
            'apropiado durante una disrupción.',
    '5.30': 'La preparación de las TIC se debe planificar, implementar, mantener y probar con base en los '
            'objetivos de continuidad del negocio y los requisitos de continuidad de las TIC.',
    '5.31': 'Los requisitos legales, estatutarios, reglamentarios y contractuales pertinentes a la '
            'seguridad de la información, y el enfoque de la organización para cumplirlos, se deben '
            'identificar, documentar y mantener actualizados.',
    '5.32': 'La organización debe implementar procedimientos adecuados para proteger los derechos de '
            'propiedad intelectual.',
    '5.33': 'Los registros se deben proteger contra pérdida, destrucción, falsificación, acceso no '
            'autorizado y divulgación no autorizada.',
    '5.34': 'La organización debe identificar y cumplir con los requisitos relacionados con la '
            'preservación de la privacidad y la protección de datos personales, de acuerdo con las leyes y '
            'regulaciones aplicables y los requisitos contractuales.',
    '5.35': 'El enfoque de la organización para gestionar la seguridad de la información y su '
            'implementación, incluidas las personas, los procesos y las tecnologías, se debe revisar de '
            'forma independiente a intervalos planificados o cuando ocurran cambios significativos.',
    '5.36': 'El cumplimiento con la política de seguridad de la información de la organización, y con las '
            'políticas, reglas y normas de temas específicos, se debe revisar periódicamente.',
    '5.37': 'Los procedimientos de operación de las instalaciones de procesamiento de información se '
            'deben documentar y poner a disposición del personal que los necesite.',
    '6.1': 'Se deben llevar a cabo verificaciones de antecedentes de todos los candidatos a ser '
           'contratados por el personal, de acuerdo con las leyes, regulaciones y ética pertinentes, y '
           'deben ser proporcionales a los requisitos del negocio, la clasificación de la información a la '
           'que se va a acceder y los riesgos percibidos.',
    '6.2': 'Los acuerdos contractuales de empleo deben establecer las responsabilidades del personal y '
           'de la organización en materia de seguridad de la información.',
    '6.3': 'El personal de la organización y las partes interesadas pertinentes deben recibir una '
           'adecuada concienciación, educación y formación en seguridad de la información, así como '
           'actualizaciones periódicas de las políticas, reglas y normas de temas específicos de la '
           'organización, pertinentes para su función laboral.',
    '6.4': 'Se debe formalizar y comunicar un proceso disciplinario para tomar acciones contra el '
           'personal y otras partes interesadas pertinentes que hayan cometido una violación de la '
           'política de seguridad de la información.',
    '6.5': 'Las responsabilidades y obligaciones de seguridad de la información que permanecen válidas '
           'después de la finalización o el cambio de empleo se deben definir, exigir su cumplimiento y '
           'comunicar al personal pertinente y a otras partes interesadas.',
    '6.6': 'Se deben identificar, documentar, revisar periódicamente y firmar por el personal y otras '
           'partes interesadas pertinentes los acuerdos de confidencialidad o no divulgación que reflejen '
           'las necesidades de la organización para la protección de la información.',
    '6.7': 'Se deben implementar medidas de seguridad cuando el personal trabaja de forma remota, para '
           'proteger la información a la que se accede, se procesa o se almacena fuera de las '
           'instalaciones de la organización.',
    '6.8': 'La organización debe proporcionar un mecanismo para que el personal reporte los eventos de '
           'seguridad de la información observados o sospechados a través de los canales apropiados de '
           'manera oportuna.',
    '7.1': 'Se deben definir y usar perímetros de seguridad para proteger las áreas que contienen '
           'información y otros activos asociados.',
    '7.2': 'Las áreas seguras se deben proteger mediante controles de ingreso y puntos de acceso '
           'adecuados.',
    '7.3': 'Se debe diseñar e implementar la seguridad física para las oficinas, despachos y recursos.',
    '7.4': 'Las instalaciones se deben monitorear continuamente para detectar accesos físicos no '
           'autorizados.',
    '7.5': 'Se debe diseñar e implementar protección contra amenazas físicas y ambientales, tales como '
           'desastres naturales y otras amenazas físicas intencionales o no intencionales a las '
           'infraestructuras.',
    '7.6': 'Se deben diseñar e implementar medidas de seguridad para trabajar en áreas seguras.',
    '7.7': 'Se deben definir y aplicar adecuadamente reglas de escritorio despejado para los documentos '
           'en papel y los medios de almacenamiento removibles, y reglas de pantalla despejada para las '
           'instalaciones de procesamiento de información.',
    '7.8': 'Los equipos se deben ubicar de forma segura y proteger.',
    '7.9': 'Se debe proteger los activos fuera de las instalaciones de la organización.',
    '7.10': 'Los medios de almacenamiento se deben gestionar a través de su ciclo de vida de '
            'adquisición, uso, transporte y disposición, de acuerdo con el esquema de clasificación y los '
            'requisitos de manejo de la organización.',
    '7.11': 'Las instalaciones de procesamiento de información se deben proteger contra fallas de '
            'energía y otras interrupciones causadas por fallas en los servicios de suministro.',
    '7.12': 'El cableado de energía y telecomunicaciones que transporta datos o soporta servicios de '
            'información se debe proteger contra intercepción, interferencia o daño.',
    '7.13': 'Los equipos se deben mantener correctamente para asegurar su disponibilidad, integridad y '
            'confidencialidad.',
    '7.14': 'Los elementos del equipo que contengan medios de almacenamiento se deben verificar para '
            'asegurar que cualquier dato sensible y software con licencia se hayan eliminado o '
            'sobrescrito de forma segura antes de su disposición o reutilización.',
    '8.1': 'La información almacenada, procesada o accesible a través de dispositivos de punto final de '
           'usuario se debe proteger.',
    '8.2': 'La asignación y el uso de derechos de acceso privilegiado se deben restringir y gestionar.',
    '8.3': 'El acceso a la información y otros activos asociados se debe restringir de acuerdo con la '
           'política de control de acceso específica del tema establecida.',
    '8.4': 'El acceso de lectura y escritura al código fuente, las herramientas de desarrollo y las '
           'bibliotecas de software se debe gestionar adecuadamente.',
    '8.5': 'Las tecnologías y procedimientos de autenticación segura se deben implementar con base en '
           'las restricciones de acceso a la información y la política de control de acceso específica '
           'del tema.',
    '8.6': 'El uso de recursos se debe monitorear y ajustar de acuerdo con los requisitos de capacidad '
           'actuales y esperados.',
    '8.7': 'Se debe implementar protección contra malware, respaldada por una adecuada concienciación '
           'del usuario.',
    '8.8': 'Se debe obtener información sobre las vulnerabilidades técnicas de los sistemas de '
           'información en uso, evaluar la exposición de la organización a tales vulnerabilidades y tomar '
           'las medidas apropiadas.',
    '8.9': 'Las configuraciones, incluidas las configuraciones de seguridad, del hardware, software, '
           'servicios y redes se deben establecer, documentar, implementar, monitorear y revisar.',
    '8.10': 'La información almacenada en sistemas de información, dispositivos u otros medios de '
            'almacenamiento se debe eliminar cuando ya no se requiera.',
    '8.11': 'Se debe utilizar enmascaramiento de datos de acuerdo con la política de control de acceso '
            'específica del tema de la organización y otras políticas específicas del tema relacionadas, '
            'y los requisitos del negocio, teniendo en cuenta la legislación aplicable.',
    '8.12': 'Se deben aplicar medidas de prevención de fuga de datos a los sistemas, redes y otros '
            'dispositivos que procesan, almacenan o transmiten información sensible.',
    '8.13': 'Se deben mantener y probar regularmente copias de seguridad de la información, el software '
            'y los sistemas, de acuerdo con la política específica del tema sobre copias de seguridad '
            'acordada.',
    '8.14': 'Las instalaciones de procesamiento de información se deben implementar con suficiente '
            'redundancia para cumplir con los requisitos de disponibilidad.',
    '8.15': 'Se deben producir, mantener, proteger y analizar registros (logs) que registren '
            'actividades, excepciones, fallas y otros eventos pertinentes.',
    '8.16': 'Las redes, sistemas y aplicaciones se deben monitorear para detectar comportamiento '
            'anómalo y se deben tomar las acciones apropiadas para evaluar los potenciales incidentes de '
            'seguridad de la información.',
    '8.17': 'Los relojes de los sistemas de procesamiento de información utilizados por la organización '
            'se deben sincronizar con fuentes de tiempo aprobadas.',
    '8.18': 'El uso de programas utilitarios que puedan ser capaces de sobrepasar los controles del '
            'sistema y de la aplicación se debe restringir y controlar estrictamente.',
    '8.19': 'Se deben implementar procedimientos y medidas para gestionar de forma segura la '
            'instalación de software en los sistemas operativos.',
    '8.20': 'Las redes y los dispositivos de red se deben proteger, gestionar y controlar para proteger '
            'la información en los sistemas y aplicaciones.',
    '8.21': 'Se deben identificar, implementar y monitorear los mecanismos de seguridad, los niveles de '
            'servicio y los requisitos de servicio de los servicios de red.',
    '8.22': 'Los grupos de servicios de información, usuarios y sistemas de información se deben '
            'segregar en las redes de la organización.',
    '8.23': 'Se debe gestionar el acceso a sitios web externos para reducir la exposición a contenido '
            'malicioso.',
    '8.24': 'Se deben definir e implementar reglas para el uso efectivo de la criptografía, incluida la '
            'gestión de claves criptográficas.',
    '8.25': 'Se deben establecer y aplicar reglas para el desarrollo seguro de software y sistemas.',
    '8.26': 'Los requisitos de seguridad de la información se deben identificar, especificar y aprobar '
            'al desarrollar o adquirir aplicaciones.',
    '8.27': 'Se deben establecer, documentar, mantener y aplicar principios de ingeniería de sistemas '
            'seguros a las actividades de desarrollo de sistemas de información.',
    '8.28': 'Los principios de codificación segura se deben aplicar al desarrollo de software.',
    '8.29': 'Se deben definir e implementar procesos de prueba de seguridad en el ciclo de vida de '
            'desarrollo.',
    '8.30': 'La organización debe dirigir, monitorear y revisar las actividades relacionadas con el '
            'desarrollo de sistemas externalizado.',
    '8.31': 'Los entornos de desarrollo, prueba y producción se deben separar y proteger.',
    '8.32': 'Los cambios a las instalaciones de procesamiento de información y a los sistemas de '
            'información se deben sujetar a procedimientos de gestión de cambios.',
    '8.33': 'La información de prueba se debe seleccionar, proteger y gestionar adecuadamente.',
    '8.34': 'Las pruebas de auditoría y otras actividades de aseguramiento que involucren la evaluación '
            'de los sistemas operacionales se deben planificar y acordar entre el probador y la gerencia '
            'pertinente.',
}


def poblar_descripciones(apps, schema_editor):
    Control = apps.get_model('controles', 'Control')
    for control in Control.objects.all():
        descripcion = DESCRIPCIONES.get(control.codigo)
        if descripcion:
            control.descripcion = descripcion
            control.save(update_fields=['descripcion'])


def revertir_descripciones(apps, schema_editor):
    Control = apps.get_model('controles', 'Control')
    Control.objects.filter(codigo__in=list(DESCRIPCIONES)).update(descripcion='')


class Migration(migrations.Migration):

    dependencies = [
        ('controles', '0003_renombrar_evidencia_y_observaciones'),
    ]

    operations = [
        migrations.RunPython(poblar_descripciones, revertir_descripciones),
    ]
