import React, { useLayoutEffect, useRef, useState } from 'react'
import { 
    AboutContainer, 
    AboutRow, 
    Column1, 
    TextWrapper, 
    Heading, 
    Description, 
    Column2, 
    ImgWrap, 
    Img, 
    AboutWrapper 
} from './AboutElements'

const AboutSection = ({id, imgStart, heading, para1, para2, para3, para4, img}) => {

    const [show, doShow] = useState({
        itemOne: false
      });
      const ourRef = useRef(null);

  useLayoutEffect(() => {
    const topPosition = ourRef.current.getBoundingClientRect().top;
    const onScroll = () => {
      const scrollPosition = window.scrollY + window.innerHeight;
     if(topPosition < scrollPosition) { 
        doShow(state => ({ ...state, itemOne: true }));
       }
    };

    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

    return (
        <div>
            <AboutContainer id={id}>
                <AboutWrapper animate={show.itemOne} ref={ourRef}>
                <AboutRow imgStart={imgStart}>
                    <Column1>
                        <TextWrapper>
                            <Heading>{heading}</Heading>
                            <Description>{para1}</Description>
							<Description>{para2}</Description>
							<Description>{para3}</Description>
                            <Description>{para4}</Description>
                        </TextWrapper>
                    </Column1>
                    <Column2>
                    <ImgWrap>
                    <Img src={img} />
                    </ImgWrap>
                    </Column2>
                </AboutRow>
                </AboutWrapper>
            </AboutContainer>
            <hr style={{width: 75+ '%', marginLeft: 12.5 + '%'}} /> 
        </div>
    )
}

export default AboutSection
