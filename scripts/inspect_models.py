from schemas.models import DailyLogResponse
print("Fields in DailyLogResponse:")
for field in DailyLogResponse.model_fields.keys():
    print(f"- {field}")
