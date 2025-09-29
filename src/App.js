import {
  buildSchema,
  isObjectType,
  isNonNullType,
  isListType,
  GraphQLDirective,
  DirectiveLocation,
  GraphQLInt,
  GraphQLString
} from 'graphql';
import React, { useState, useMemo } from 'react';

// Helper para "desenvolver" tipos NonNull o List y obtener el tipo base
function unwrapType(type) {
  if (isNonNullType(type) || isListType(type)) {
    return unwrapType(type.ofType);
  }
  return type;
}

// Componente recursivo para renderizar campos con checkboxes
function FieldSelector({ schema, type, path, selectedFields, setSelectedFields }) {
  if (!isObjectType(type)) return null;

  const fields = type.getFields();

  // Función para marcar o desmarcar un campo
  const toggleField = (fieldName) => {
    const fullPath = [...path, fieldName].join('.');
    setSelectedFields((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(fullPath)) {
        // Si se desmarca, quitar el campo y todos sus descendientes
        for (const selected of newSet) {
          if (selected === fullPath || selected.startsWith(fullPath + '.')) {
            newSet.delete(selected);
          }
        }
      } else {
        // Si se marca, añadir el campo
        newSet.add(fullPath);
      }
      return newSet;
    });
  };

  return (
    <ul style={{ listStyle: 'none', paddingLeft: '1em', borderLeft: '1px solid #ccc' }}>
      {Object.values(fields).map((field) => {
        const fieldType = unwrapType(field.type);
        const fullPath = [...path, field.name].join('.');
        const isSelected = selectedFields.has(fullPath);

        return (
          <li key={fullPath}>
            <label>
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => toggleField(field.name)}
              />
              {field.name} ({fieldType.name || fieldType.toString()})
            </label>

            {/* Renderizar subcampos si es objeto y está seleccionado */}
            {isSelected && isObjectType(fieldType) && (
              <FieldSelector
                schema={schema}
                type={fieldType}
                path={[...path, field.name]}
                selectedFields={selectedFields}
                setSelectedFields={setSelectedFields}
              />
            )}
          </li>
        );
      })}
    </ul>
  );
}

// Construye un árbol de campos a partir de los paths seleccionados
function buildFieldTree(paths) {
  const tree = {};
  paths.forEach((path) => {
    const parts = path.split('.');
    let current = tree;
    for (const part of parts) {
      if (!current[part]) {
        current[part] = {};
      }
      current = current[part];
    }
  });
  return tree;
}

// Renderiza recursivamente el árbol de campos en formato GraphQL
function renderFieldTree(tree, type, schema, indent = '  ') {
  if (!isObjectType(type)) return '';

  const fields = type.getFields();
  return Object.entries(tree)
    .map(([fieldName, subTree]) => {
      const field = fields[fieldName];
      if (!field) return '';
      const fieldType = unwrapType(field.type);
      if (Object.keys(subTree).length > 0 && isObjectType(fieldType)) {
        return `${indent}${fieldName} {\n${renderFieldTree(subTree, fieldType, schema, indent + '  ')}\n${indent}}`;
      } else {
        return `${indent}${fieldName}`;
      }
    })
    .join('\n');
}

// Genera la query GraphQL a partir de los campos seleccionados
function generateQuery(schema, selectedFields) {
  const queryType = schema.getQueryType();
  if (!queryType) return '';

  const fieldTree = buildFieldTree([...selectedFields]);
  const body = renderFieldTree(fieldTree, queryType, schema);
  return `query {\n${body}\n}`;
}

// Componente principal
export default function GraphQLCheckboxBuilder() {
  const [schemaSDL, setSchemaSDL] = useState('');
  const [selectedFields, setSelectedFields] = useState(new Set());
  const [error, setError] = useState(null);
  const [copySuccess, setCopySuccess] = useState('');
  const [fileName, setFileName] = useState('query.graphql');

  // Convierte el SDL en schema GraphQL usando buildSchema
  const schema = useMemo(() => {
    if (!schemaSDL.trim()) {
      setError(null);
      setSelectedFields(new Set());
      return null;
    }
    try {
      // Definir directivas personalizadas para aceptar SDL sin modificarlo
      const sizeDirective = new GraphQLDirective({
        name: 'size',
        locations: [DirectiveLocation.INPUT_FIELD_DEFINITION, DirectiveLocation.ARGUMENT_DEFINITION],
        args: { min: { type: GraphQLInt }, max: { type: GraphQLInt } },
      });
      const patternDirective = new GraphQLDirective({
        name: 'pattern',
        locations: [DirectiveLocation.INPUT_FIELD_DEFINITION, DirectiveLocation.ARGUMENT_DEFINITION],
        args: { regex: { type: GraphQLString } },
      });

      const parsedSchema = buildSchema(schemaSDL, {
        assumeValid: true,
        directives: [sizeDirective, patternDirective],
      });

      setError(null);
      return parsedSchema;
    } catch (e) {
      setError(e.message);
      return null;
    }
  }, [schemaSDL]);

  const query = schema ? generateQuery(schema, selectedFields) : '';

  // Copiar la query al portapapeles
  const handleCopy = () => {
    if (!query) return;
    navigator.clipboard.writeText(query)
      .then(() => {
        setCopySuccess('Query copiada al portapapeles!');
        setTimeout(() => setCopySuccess(''), 2000);
      })
      .catch(() => setCopySuccess('Error copiando la query'));
  };

  // Exportar query como archivo .graphql
  function handleExport() {
    if (!schema) return;
    if (!fileName.trim()) {
      alert('Por favor, escribe un nombre válido para el archivo.');
      return;
    }

    let exportFileName = fileName.trim();
    if (!exportFileName.endsWith('.graphql')) {
      exportFileName += '.graphql';
    }

    const query = generateQuery(schema, selectedFields);
    const blob = new Blob([query], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = exportFileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  // Selecciona todos los campos de la Query
  const selectAllFields = () => {
    if (!schema) return;
    const allFields = new Set();
    const collectFields = (type, prefix = []) => {
      if (!isObjectType(type)) return;
      const fields = type.getFields();
      Object.values(fields).forEach((field) => {
        const fullPath = [...prefix, field.name].join('.');
        allFields.add(fullPath);
        collectFields(unwrapType(field.type), [...prefix, field.name]);
      });
    };
    collectFields(schema.getQueryType());
    setSelectedFields(allFields);
  };

  return (
    <div style={{ fontFamily: 'monospace', fontSize: 14, maxWidth: 700, margin: 'auto' }}>
      <h3>Introduce el esquema GraphQL (SDL)</h3>
      <textarea
        placeholder="Pega tu esquema GraphQL aquí..."
        value={schemaSDL}
        onChange={(e) => setSchemaSDL(e.target.value)}
        rows={15}
        style={{ width: '100%', fontFamily: 'monospace', fontSize: 14 }}
      />
      {error && <div style={{ color: 'red' }}>Error en el esquema: {error}</div>}

      {schema ? (
        <>
          <h3>Selecciona campos para tu Query</h3>
          <FieldSelector
            schema={schema}
            type={schema.getQueryType()}
            path={[]}
            selectedFields={selectedFields}
            setSelectedFields={setSelectedFields}
          />

          <h3>Query generada</h3>
          <pre>{query}</pre>
          <div style={{ marginTop: '10px', display: 'flex', gap: '10px' }}>
            <button onClick={handleCopy}>Copiar query</button>
            <button onClick={() => setSelectedFields(new Set())}>Limpiar selección</button>
          </div>
          <button onClick={selectAllFields} style={{ marginTop: '10px' }}>Seleccionar todo</button>

          <div style={{ marginTop: '10px' }}>
            <label>
              Nombre del archivo:{' '}
              <input
                type="text"
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
                style={{ fontFamily: 'monospace', fontSize: 14, width: 200 }}
                placeholder="nombre.graphql"
              />
            </label>
            <button onClick={handleExport} style={{ marginLeft: '10px' }}>
              Exportar query
            </button>
          </div>
          {copySuccess && <div style={{ color: 'green', marginTop: '5px' }}>{copySuccess}</div>}
        </>
      ) : (
        !error && <div style={{ color: '#555' }}>Introduce un esquema GraphQL válido para comenzar</div>
      )}
    </div>
  );
}