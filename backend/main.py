from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List

from . import models, database

# Criar as tabelas no banco de dados SQLite
models.Base.metadata.create_all(bind=database.engine)

app = FastAPI(title="DB Planner API")

# Configurar o CORS para permitir que o frontend (na porta 5173) acesse o backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/api/diagrams", response_model=models.DiagramResponse)
def create_diagram(diagram: models.DiagramCreate, db: Session = Depends(database.get_db)):
    db_diagram = models.DiagramModel(
        name=diagram.name, 
        nodes=diagram.nodes, 
        edges=diagram.edges
    )
    db.add(db_diagram)
    db.commit()
    db.refresh(db_diagram)
    return db_diagram

@app.get("/api/diagrams", response_model=List[models.DiagramResponse])
def read_diagrams(skip: int = 0, limit: int = 100, db: Session = Depends(database.get_db)):
    diagrams = db.query(models.DiagramModel).offset(skip).limit(limit).all()
    return diagrams

@app.get("/api/diagrams/{diagram_id}", response_model=models.DiagramResponse)
def read_diagram(diagram_id: int, db: Session = Depends(database.get_db)):
    diagram = db.query(models.DiagramModel).filter(models.DiagramModel.id == diagram_id).first()
    if diagram is None:
        raise HTTPException(status_code=404, detail="Diagram not found")
    return diagram

@app.put("/api/diagrams/{diagram_id}", response_model=models.DiagramResponse)
def update_diagram(diagram_id: int, diagram: models.DiagramCreate, db: Session = Depends(database.get_db)):
    db_diagram = db.query(models.DiagramModel).filter(models.DiagramModel.id == diagram_id).first()
    if db_diagram is None:
        raise HTTPException(status_code=404, detail="Diagram not found")
    
    db_diagram.name = diagram.name
    db_diagram.nodes = diagram.nodes
    db_diagram.edges = diagram.edges
    db.commit()
    db.refresh(db_diagram)
    return db_diagram
