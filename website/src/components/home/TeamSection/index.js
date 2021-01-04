import React, { useLayoutEffect, useRef, useState } from 'react'
import { TeamContainer, Heading, TeamRow, Column, Img, Title, Desc } from './TeamElements'

const TeamSection = ({id, heading, name1, img1, desc1, name2, img2, desc2, name3, img3, desc3}) => {

    const [show, doShow] = useState({
        itemOne: false,
        itemTwo: false
      });
      const refOne = useRef(null);
      const refTwo = useRef(null);

  useLayoutEffect(() => {
    const topPosition1 = refOne.current.getBoundingClientRect().top;
    const topPosition2 = refTwo.current.getBoundingClientRect().top;
    const onScroll = () => {
      const scrollPosition = window.scrollY + window.innerHeight;
     if(topPosition1 < scrollPosition) { 
        doShow(state => ({ ...state, itemOne: true }));
       }
     if (topPosition2 < scrollPosition) {
        doShow(state => ({ ...state, itemTwo: true }));
     }
    };

    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

    return (
        <div>
            <TeamContainer id={id}>
                <Heading animate={show.itemOne} ref={refOne}>{heading}</Heading>
                <TeamRow animate={show.itemTwo} ref={refTwo}>
                    <Column>
                    <Img src={img1} />
                    <Title>{name1}</Title>
                    <Desc>{desc1}</Desc>
                    </Column>
                    <Column>
                    <Img src={img2} />
                    <Title>{name2}</Title>
                    <Desc>{desc2}</Desc>
                    </Column>
                    <Column>
                    <Img src={img3} />
                    <Title>{name3}</Title>
                    <Desc>{desc3}</Desc>
                    </Column>
                </TeamRow>
            </TeamContainer>
            
        </div>
    )
}

export default TeamSection
