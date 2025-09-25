#!/usr/bin/env node

const https = require('https');
const http = require('http');
const fs = require('fs');

// GraphQL introspection query
const introspectionQuery = `
query IntrospectionQuery {
  __schema {
    queryType { name }
    mutationType { name }
    subscriptionType { name }
    types {
      ...FullType
    }
    directives {
      name
      description
      locations
      args {
        ...InputValue
      }
    }
  }
}

fragment FullType on __Type {
  kind
  name
  description
  fields(includeDeprecated: true) {
    name
    description
    args {
      ...InputValue
    }
    type {
      ...TypeRef
    }
    isDeprecated
    deprecationReason
  }
  inputFields {
    ...InputValue
  }
  interfaces {
    ...TypeRef
  }
  enumValues(includeDeprecated: true) {
    name
    description
    isDeprecated
    deprecationReason
  }
  possibleTypes {
    ...TypeRef
  }
}

fragment InputValue on __InputValue {
  name
  description
  type { ...TypeRef }
  defaultValue
}

fragment TypeRef on __Type {
  kind
  name
  ofType {
    kind
    name
    ofType {
      kind
      name
      ofType {
        kind
        name
        ofType {
          kind
          name
          ofType {
            kind
            name
            ofType {
              kind
              name
              ofType {
                kind
                name
              }
            }
          }
        }
      }
    }
  }
}
`;

function fetchSchema(url) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      query: introspectionQuery
    });

    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const client = url.startsWith('https') ? https : http;
    const req = client.request(url, options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          if (response.errors) {
            reject(new Error(`GraphQL errors: ${JSON.stringify(response.errors)}`));
          } else {
            resolve(response.data);
          }
        } catch (error) {
          reject(new Error(`Failed to parse response: ${error.message}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(postData);
    req.end();
  });
}

function generateSchemaFromIntrospection(schema) {
  let result = '';
  
  // Helper function to get type string from introspection type
  function getTypeString(type) {
    if (type.kind === 'NON_NULL') {
      return getTypeString(type.ofType) + '!';
    } else if (type.kind === 'LIST') {
      return '[' + getTypeString(type.ofType) + ']';
    } else {
      return type.name;
    }
  }

  // Generate types - schema should have __schema.types
  const types = schema.__schema ? schema.__schema.types : schema.types;
  
  if (!types || !Array.isArray(types)) {
    throw new Error('Invalid schema structure: types not found or not an array');
  }

  // Filter out built-in types and get only our custom types
  const customTypes = types.filter(type => 
    type.name && 
    !type.name.startsWith('__') && 
    (type.kind === 'OBJECT' || type.kind === 'INPUT_OBJECT' || type.kind === 'ENUM')
  );

  console.log(`Found ${customTypes.length} custom types:`, customTypes.map(t => t.name));

  for (const type of customTypes) {

    if (type.kind === 'OBJECT') {
      result += `type ${type.name} {\n`;
      if (type.fields) {
        for (const field of type.fields) {
          const fieldType = getTypeString(field.type);
          let fieldDef = `  ${field.name}`;
          
          // Add arguments if any
          if (field.args && field.args.length > 0) {
            const args = field.args.map(arg => `${arg.name}: ${getTypeString(arg.type)}`).join(', ');
            fieldDef += `(${args})`;
          }
          
          fieldDef += `: ${fieldType}`;
          result += fieldDef + '\n';
        }
      }
      result += '}\n\n';
    } else if (type.kind === 'INPUT_OBJECT') {
      result += `input ${type.name} {\n`;
      if (type.inputFields) {
        for (const field of type.inputFields) {
          const fieldType = getTypeString(field.type);
          result += `  ${field.name}: ${fieldType}\n`;
        }
      }
      result += '}\n\n';
    } else if (type.kind === 'ENUM') {
      result += `enum ${type.name} {\n`;
      if (type.enumValues) {
        for (const value of type.enumValues) {
          result += `  ${value.name}\n`;
        }
      }
      result += '}\n\n';
    }
  }

  return result;
}

// Main execution
async function main() {
  const url = process.argv[2] || 'http://localhost:4000/graphql';
  
  try {
    console.log(`🔍 Fetching schema from ${url}...`);
    const schema = await fetchSchema(url);
    
    console.log('📝 Generating schema.graphql...');
    const schemaContent = generateSchemaFromIntrospection(schema);
    
    fs.writeFileSync('schema.graphql', schemaContent);
    console.log('✅ Schema saved to schema.graphql');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();
