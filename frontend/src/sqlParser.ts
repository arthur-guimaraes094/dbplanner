export function parseSQLToDiagram(sql: string) {
  const nodes: any[] = [];
  const edges: any[] = [];
  
  // Regex para pegar o nome da tabela e o conteúdo entre os parênteses principais
  // A versão anterior \);? falhava prematuramente se houvesse parênteses dentro como VARCHAR(255) ou FOREIGN KEY()
  const createTableRegex = /CREATE\s+TABLE\s+["`]?(\w+)["`]?\s*\(([\s\S]*?)\)\s*(?:;|$)/gi;
  
  let match;
  let xOffset = 50;
  let yOffset = 50;
  
  const fkConstraints: any[] = [];

  while ((match = createTableRegex.exec(sql)) !== null) {
    const tableName = match[1];
    const columnsText = match[2];
    
    // Divide pelas linhas (ou vírgulas se for linha única, mas vamos assumir que cada coluna tá numa linha)
    // Para ser mais robusto, substituímos vírgulas por quebras de linha se não estiver dentro de parênteses (ex: VARCHAR(255))
    // Simplificando: vamos quebrar por nova linha ou vírgula seguida de nova linha
    const lines = columnsText.split('\n');
    const columns: any[] = [];
    
    const nodeId = `node_${tableName}`;

    lines.forEach(line => {
      const cleanLine = line.trim().replace(/,$/, '');
      if (!cleanLine) return;

      // Verifica se é uma FOREIGN KEY constraint
      const fkMatch = cleanLine.match(/FOREIGN\s+KEY\s*\(\s*["`]?(\w+)["`]?\s*\)\s*REFERENCES\s*["`]?(\w+)["`]?\s*\(\s*["`]?(\w+)["`]?\s*\)/i);
      
      if (fkMatch) {
         const colName = fkMatch[1];
         const targetTable = fkMatch[2];
         const targetCol = fkMatch[3];
         
         fkConstraints.push({
           sourceTableName: tableName,
           sourceColName: colName,
           targetTableName: targetTable,
           targetColName: targetCol
         });
      } else {
         // Verifica se é uma coluna normal: "id" INTEGER
         const colMatch = cleanLine.match(/^["`]?(\w+)["`]?\s+([A-Za-z]+)/);
         if (colMatch) {
             const colName = colMatch[1];
             const typeStr = colMatch[2].toLowerCase();
             
             let type = 'varchar';
             if (typeStr.includes('int')) type = 'integer';
             else if (typeStr.includes('bool')) type = 'boolean';
             else if (typeStr.includes('date')) type = 'date';
             else if (typeStr.includes('time')) type = 'timestamp';
             else if (typeStr.includes('num') || typeStr.includes('dec')) type = 'numeric';
             else if (typeStr.includes('float') || typeStr.includes('double')) type = 'float';
             else if (typeStr.includes('uuid')) type = 'uuid';
             else if (typeStr.includes('text')) type = 'text';

             columns.push({
                 id: `col_${tableName}_${colName}_${Date.now()}_${Math.floor(Math.random()*1000)}`,
                 name: colName,
                 type: type
             });
         }
      }
    });

    nodes.push({
      id: nodeId,
      type: 'tableNode',
      position: { x: xOffset, y: yOffset },
      data: {
        label: tableName,
        columns: columns
      }
    });
    
    xOffset += 350;
    if (xOffset > 1200) {
      xOffset = 50;
      yOffset += 450;
    }
  }

  // Processa as FKs
  fkConstraints.forEach(fk => {
     const sourceNode = nodes.find(n => n.data.label === fk.sourceTableName);
     const targetNode = nodes.find(n => n.data.label === fk.targetTableName);
     
     if (sourceNode && targetNode) {
         const sourceCol = sourceNode.data.columns.find((c: any) => c.name === fk.sourceColName);
         const targetCol = targetNode.data.columns.find((c: any) => c.name === fk.targetColName);
         
         if (sourceCol && targetCol) {
             sourceCol.type = 'fk';
             sourceCol.fkTargetTable = targetNode.id;
             sourceCol.fkTargetCol = targetCol.id;
             
             edges.push({
                 id: `e-${sourceNode.id}-${sourceCol.id}-${targetNode.id}-${targetCol.id}`,
                 source: sourceNode.id,
                 sourceHandle: `${sourceCol.id}-source`,
                 target: targetNode.id,
                 targetHandle: `${targetCol.id}-left-target`,
                 animated: true,
                 style: { stroke: '#3b82f6', strokeWidth: 2, strokeDasharray: '5, 5' },
                 markerEnd: 'url(#crows-foot)',
                 className: 'pulsing-edge'
             });
         }
     }
  });

  return { newNodes: nodes, newEdges: edges };
}
