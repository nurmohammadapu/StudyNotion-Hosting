import { combineReducers } from "@reduxjs/toolkit";
import authSlice from "./Slices/authSlice";
import cartSlice from "./Slices/cartSlice";
import profileSlice from "./Slices/profileSlice";
import courseSlice from "./Slices/courseSlice";
import viewCourseReducer from "./Slices/viewCourseSlice";

const rootReducer = combineReducers({
    auth:authSlice,
    cart:cartSlice,
    profile:profileSlice,
    course:courseSlice,
    viewCourse: viewCourseReducer,

})

export default rootReducer;