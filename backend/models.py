from sqlalchemy import Column, Integer, String, JSON
from .database import Base
from pydantic import BaseModel
from typing import List, Dict, Any, Optional

# --- SQLAlchemy Models (Banco de Dados) ---
class DiagramModel(Base):
    __tablename__ = "diagrams"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    # Vamos salvar os nós e conexões do React Flow como JSON
    nodes = Column(JSON, default=[])
    edges = Column(JSON, default=[])

# --- Pydantic Models (Validação da API) ---
class DiagramCreate(BaseModel):
    name: str
    nodes: List[Dict[str, Any]]
    edges: List[Dict[str, Any]]

class DiagramResponse(DiagramCreate):
    id: int

    class Config:
        from_attributes = True
