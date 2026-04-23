const sql = `
CREATE TABLE Nota (
  id INTEGER,
  avaliacao_id INTEGER,
  aluno_id INTEGER,
  valor NUMERIC,
  FOREIGN KEY (avaliacao_id) REFERENCES Avaliacao (id),
  FOREIGN KEY (aluno_id) REFERENCES Aluno (id)
);
`;

const createTableRegex = /CREATE\s+TABLE\s+["`]?(\w+)["`]?\s*\(([\s\S]*?)\)\s*;/gi;
let match;
while ((match = createTableRegex.exec(sql)) !== null) {
  const columnsText = match[2];
  console.log("columnsText: ", JSON.stringify(columnsText));
}
