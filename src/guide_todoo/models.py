from pydantic import BaseModel, Field


class ParsedTask(BaseModel):
    title: str
    description: str = ""
    priority: int = Field(default=2, ge=1, le=3)
    due_date: str | None = None
    subtasks: list["ParsedTask"] = Field(default_factory=list)


ParsedTask.model_rebuild()


class DailyPlanItem(BaseModel):
    task_id: int | None = None
    title: str
    scheduled_time: str | None = None
    reason: str = ""


class DailyPlanResult(BaseModel):
    summary: str
    items: list[DailyPlanItem]
    focus: str = ""
