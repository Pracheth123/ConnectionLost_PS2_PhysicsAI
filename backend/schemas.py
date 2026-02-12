from pydantic import BaseModel, Field
from typing import List

class PhysicsObject(BaseModel):
    label: str = Field(..., description="Name of the object, e.g., 'Ball'")
    color: str = Field("red", description="Color of the object")
    
    # 3D Position (Start)
    start_x: float = 0.0
    start_y: float = 0.0
    start_z: float = 0.0

    # 3D Velocity (Initial)
    velocity_x: float = 0.0
    velocity_y: float = 0.0
    velocity_z: float = 0.0

    # 3D Acceleration
    acceleration_x: float = 0.0
    acceleration_y: float = -9.8  # Default Gravity
    acceleration_z: float = 0.0

class SimulationResponse(BaseModel):
    objects: List[PhysicsObject]
    explanation: str = Field(..., description="Brief physics explanation of the setup")