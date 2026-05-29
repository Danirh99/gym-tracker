<?php

namespace App\Entity;

enum ExerciseType: string
{
    case Strength = 'strength';
    case Cardio = 'cardio';
    case Core = 'core';
    case Other = 'other';
}
