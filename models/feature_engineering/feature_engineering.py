# feature_engineering.py

import pandas as pd
import numpy as np

def feature_engineering(df):

    df = df.copy()

    # -------------------------------
    # BASIC CLEANING
    # -------------------------------
    df['Gender'] = df['Gender'].astype(str).str.strip().str.lower()
    df['Gender'] = df['Gender'].map({'male': 0, 'female': 1}).fillna(0)

    # -------------------------------
    # BMI (FROM SUPABASE) — only compute if Height/Weight present
    # -------------------------------
    if 'Height' in df.columns and 'Weight' in df.columns:
        df['BMI'] = df['Weight'] / ((df['Height'] / 100) ** 2)
        df.drop(columns=['Height', 'Weight'], inplace=True)
    # If BMI already exists (from dataset), keep it as-is

    # -------------------------------
    # BMI CATEGORY
    # -------------------------------
    def bmi_category(bmi):
        if bmi < 18.5:
            return 0
        elif bmi < 25:
            return 1
        elif bmi < 30:
            return 2
        else:
            return 3

    df['bmi_category'] = df['BMI'].apply(bmi_category)

    # -------------------------------
    # NOTE: StressLevel and dopamine_score are NOT derived here.
    # They already exist in the dataset / are passed in from the caller.
    # The model was trained on those original values:
    #   StressLevel: 0 (Low), 1 (Medium), 2 (High)
    #   dopamine_score: ScreenTime * 0.5 + LateNightUsage * 0.5
    # -------------------------------

    # -------------------------------
    # INTERNAL SCORES (used for scoring AND as model features)
    # -------------------------------
    SleepScore = 1 - abs(df['SleepHours'] - 7.5) / 7.5
    ActivityScore = df['ActivityLevel'] / 5
    DietScore = df['DietQuality'] / 5       # DietQuality: 0=Poor, 1=Average, 2=Good
    StressScore = df['StressLevel'] / 10
    SedentaryIndex = (df['SittingTime'] + df['InactivityPeriods']) / 20
    DigitalLoad = df['ScreenTime']

    # -------------------------------
    # ENGINEERED FEATURES (model expects these)
    # -------------------------------
    df['SleepScore'] = SleepScore
    df['ActivityScore'] = ActivityScore
    df['DietScore'] = DietScore
    df['StressScore'] = StressScore
    df['SedentaryIndex'] = SedentaryIndex
    df['DigitalLoad'] = DigitalLoad
    df['LateNightImpact'] = df['LateNightUsage'] * 0.5
    df['CalorieBalance'] = 1 - abs(df['CalorieIntake'] - 2000) / 2000
    df['MealScore'] = DietScore
    # DopamineScore is a separate composite feature from dopamine_score
    # dopamine_score (lowercase) = ScreenTime*0.5 + LateNightUsage*0.5 (from dataset)
    # DopamineScore (CamelCase) = broader composite score
    df['DopamineScore'] = (
        df['ScreenTime'] * 0.4 +
        df['LateNightUsage'] * 2 +
        df['StressLevel'] * 0.3 +
        (10 - df['SleepHours']) * 0.3
    )

    # -------------------------------
    # COMPOSITE FEATURES
    # -------------------------------
    df['health_score'] = (
        SleepScore +
        ActivityScore +
        DietScore +
        (1 - StressScore) +
        (1 - SedentaryIndex)
    ) / 5

    df['lifestyle_risk'] = (
        DigitalLoad * 0.2 +
        StressScore * 0.2 +
        SedentaryIndex * 0.2 +
        (1 - SleepScore) * 0.2 +
        (1 - ActivityScore) * 0.2
    )

    # Handle missing values
    df.fillna(df.mean(numeric_only=True), inplace=True)

    # -------------------------------
    # FINAL FEATURE LIST — all 26 features the XGBoost model expects
    # -------------------------------
    final_features = [
        'ScreenTime',
        'SleepHours',
        'LateNightUsage',
        'ActivityLevel',
        'DietQuality',
        'SittingTime',
        'InactivityPeriods',
        'StressLevel',
        'Gender',
        'MealsPerDay',
        'CalorieIntake',
        'BMI',
        'dopamine_score',
        'lifestyle_risk',
        'health_score',
        'bmi_category',
        'SleepScore',
        'DigitalLoad',
        'LateNightImpact',
        'ActivityScore',
        'SedentaryIndex',
        'CalorieBalance',
        'MealScore',
        'DietScore',
        'StressScore',
        'DopamineScore',
    ]

    return df[final_features]