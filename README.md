**# GraphQL Builder**

## URL
https://graphqliteggo.netlify.app/

## Descripción

**GraphQL Builder** es una aplicación web nos que permite generar **queries GraphQL personalizadas** de manera visual. Podemos pegar un esquema GraphQL (SDL), seleccionar los campos que desean incluir en la query usando checkboxes, y obtener la query generada automáticamente en formato válido.  

El objetivo principal es simplificar la construcción de queries, especialmente en esquemas complejos con subobjetos anidados, y facilitar la exportación o copia de la query final.

---

## Características principales

- **Carga de esquema SDL:** Permite pegar el esquema GraphQL completo (SDL) para análisis.  
- **Selector visual de campos:** Generación dinámica de checkboxes para cada campo del esquema, incluyendo campos anidados.  
- **Generación automática de queries:** Construye la query GraphQL en tiempo real según los campos seleccionados.  
- **Exportación de queries:** Permite copiar la query al portapapeles o exportarla como un archivo `.graphql`.  
- **Soporte de directivas personalizadas:** Reconoce `@size` y `@pattern` para validar argumentos sin modificar el esquema.  
- **Selección recursiva:** Al seleccionar un objeto, se pueden seleccionar sus subcampos recursivamente.  
- **Seleccionar todo / Limpiar selección:** Facilita la selección masiva de campos o el reinicio de la selección.  

---

## Arquitectura

La aplicación se divide en los siguientes componentes principales:

### 1. **FieldSelector**
- Componente recursivo que renderiza todos los campos de un tipo GraphQL.
- Permite seleccionar o deseleccionar campos mediante checkboxes.
- Gestiona de manera recursiva los subcampos de objetos anidados.

### 2. **generateQuery**
- Función que construye el **árbol de campos** a partir de los campos seleccionados.
- Renderiza el árbol como una **query GraphQL válida**, respetando la jerarquía de objetos y listas.

### 3. **GraphQLCheckboxBuilder (Componente principal)**
- Gestiona el estado de:
  - Esquema SDL (`schemaSDL`)
  - Campos seleccionados (`selectedFields`)
  - Mensajes de error y éxito (`error`, `copySuccess`)
- Convierte el SDL en un **GraphQLSchema** usando `buildSchema`.
- Permite exportar la query generada o copiarla al portapapeles.
- Permite seleccionar todos los campos de manera automática.

---

## Flujo de trabajo

1. El usuario pega el **esquema SDL** en el área de texto.  
2. La aplicación convierte el SDL en un **GraphQLSchema** usando `buildSchema` de `graphql`.  
3. Se renderiza un árbol de checkboxes basado en el **QueryType** del esquema.  
4. El usuario selecciona los campos deseados.  
5. La aplicación genera dinámicamente la **query GraphQL** según los campos seleccionados.  
6. El usuario puede copiar la query o exportarla como un archivo `.graphql`.  

---

## Funciones auxiliares

- **unwrapType:** Desenvuelve tipos `NonNull` y `List` para obtener el tipo base.  
- **buildFieldTree:** Convierte un set de paths seleccionados en un árbol de campos.  
- **renderFieldTree:** Renderiza recursivamente el árbol de campos en formato GraphQL.  
- **selectAllFields:** Selecciona todos los campos del `QueryType` del esquema.  
- **handleCopy / handleExport:** Permiten copiar la query al portapapeles o exportarla como archivo.  

---

## Tecnologías

- **React:** UI dinámica y manejo de estados.  
- **GraphQL (`graphql` package):** Parsing y análisis del esquema SDL.  
- **JavaScript:** Lógica de selección de campos y construcción de queries.

---
