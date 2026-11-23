// The School Day Food Preferences sheet now lives in ./garden. This path stays because the admin
// FamilyPreferencesClient imports the option lists and label helpers from here.
export {
  EMERGENCY_SNACK_OPTIONS,
  SHARED_FOOD_OPTIONS,
  getEmergencySnackLabel,
  getSharedFoodLabel,
} from "./garden/foodOptions";
export { default } from "./garden/FoodPreferencesSheet";
