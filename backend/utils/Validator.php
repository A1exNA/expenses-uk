<?php
namespace utils;

class Validator {
    public static function required($value, $field) {
        if (empty($value) && $value !== '0') {
            return "$field is required";
        }
        return null;
    }
    
    public static function integer($value, $field) {
        if (!filter_var($value, FILTER_VALIDATE_INT)) {
            return "$field must be an integer";
        }
        return null;
    }
    
    // Добавим другие методы по необходимости
}