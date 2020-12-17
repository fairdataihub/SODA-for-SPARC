import React, { useLayoutEffect, useRef, useState } from 'react'
import { FeatureContainer, Heading, Intro, Column, FeatureRow, FeatureTitle, Feature, Img, Icon } from './FeatureElements'
import { FaRegFolderOpen, FaMobileAlt } from 'react-icons/fa'
import { BsGraphUp, BsGearFill, BsPeopleFill } from 'react-icons/bs'
import { GrDiamond } from 'react-icons/gr'

const FeatureSection = ({
    id, 
    heading, 
    intro, 
    img, 
    featTitleOne, 
    featTitleTwo, 
    featTitleThree, 
    featTitleFour, 
    featTitleFive, 
    featTitleSix, 
    featDescOne,
    featDescTwo,
    featDescThree,
    featDescFour,
    featDescFive,
    featDescSix
}) => {

    const [show, doShow] = useState({
        itemOne: false,
        itemTwo: false,
        itemThree: false
      });
      const refOne = useRef(null);
      const refTwo = useRef(null);
      const refThree = useRef(null);

  useLayoutEffect(() => {
    const topPosition1 = refOne.current.getBoundingClientRect().top;
    const topPosition2 = refTwo.current.getBoundingClientRect().top;
    const topPosition3 = refThree.current.getBoundingClientRect().top;
    const onScroll = () => {
      const scrollPosition = window.scrollY + window.innerHeight;
     if(topPosition1 < scrollPosition) { 
        doShow(state => ({ ...state, itemOne: true }));
       }
     if (topPosition2 < scrollPosition) {
        doShow(state => ({ ...state, itemTwo: true }));
     }
     if (topPosition3 < scrollPosition) {
        doShow(state => ({ ...state, itemThree: true }));
     }
    };

    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

    return (
        <div>
            <FeatureContainer id={id}>
                <Heading animate={show.itemOne} ref={refOne}>{heading}</Heading>
                <Intro animate={show.itemTwo} ref={refTwo}>{intro}</Intro>
                <FeatureRow animate={show.itemThree} ref={refThree}>
                    <Column>
                    <FeatureTitle>
                        <Icon>
                            <FaRegFolderOpen />
                        </Icon>
                        {featTitleOne}
                    </FeatureTitle>
                    <Feature>{featDescOne}</Feature>
                    <FeatureTitle>
                        <Icon>
                            <BsGraphUp />
                        </Icon>
                        {featTitleTwo}
                    </FeatureTitle>
                    <Feature>{featDescTwo}</Feature>
                    <FeatureTitle>
                        <Icon>
                            <BsGearFill />
                        </Icon>
                        {featTitleThree}
                    </FeatureTitle>
                    <Feature>{featDescThree}</Feature>
                    </Column>
                    <Column>
                    <Img src={img} />
                    </Column>
                    <Column>
                    <FeatureTitle>
                        <Icon>
                            <GrDiamond />
                        </Icon>
                        {featTitleFour}
                    </FeatureTitle>
                    <Feature>{featDescFour}</Feature>
                    <FeatureTitle>
                        <Icon>
                            <BsPeopleFill />
                        </Icon>
                        {featTitleFive}
                    </FeatureTitle>
                    <Feature>{featDescFive}</Feature>
                    <FeatureTitle>
                        <Icon>
                            <FaMobileAlt />
                        </Icon>
                        {featTitleSix}
                    </FeatureTitle>
                    <Feature>{featDescSix}</Feature>
                    </Column>
                </FeatureRow>
            </FeatureContainer>
            <hr style={{width: 75+ '%', marginLeft: 12.5 + '%'}} /> 
        </div>
    )
}

export default FeatureSection
