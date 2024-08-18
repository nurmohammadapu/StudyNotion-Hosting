import React from 'react';
import HighlightText from './HighlightText'
import know_your_progress from '../../../assets/Images/Know_your_progress.png'
import compare_with_others from '../../../assets/Images/Compare_with_others.png'
import plan_your_lessons from '../../../assets/Images/Plan_your_lessons.png'
import CTAButton from './Button.jsx'
const LearingLanguageSection = () => {
    return (
        <div>
            <div className="text-4xl font-semibold text-center my-10">
                <h1 className='text-4xl text-center mx-auto font-bold  text-richblack-900 w-11/12'>Your swiss knfie for <HighlightText  text={"learning any language"}/></h1>
                <p className="text-center text-richblack-700 font-medium lg:w-[75%] mx-auto leading-6 text-base mt-3">Using spin making learning multiple languages easy. with 20+ languages realistic voice-over, progress tracking, custom schedule and more.</p>
            </div>

            <div className="flex flex-col lg:flex-row items-center justify-center mt-8 lg:mt-0">
                <img src={know_your_progress} alt="know_your_progress" className='object-contain -mr-32' />
                <img src={compare_with_others} alt="compare_with_others" className='object-contain lg:-mb-10 lg:-mt-0 -mt-12' />
                <img src={plan_your_lessons} alt="plan_your_lessons" className='object-contain lg:-ml-36 lg:-mt-5 -mt-16' />   
            </div>

            <div className='w-fit mx-auto lg:mb-20 mb-8 mt-5'>
            <CTAButton  active={true} linkto={"login"} >
            <p>
            Learn More  
            </p>
            </CTAButton>

            </div>


        </div>
    );
};

export default LearingLanguageSection;