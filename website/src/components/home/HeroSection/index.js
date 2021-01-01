import React, { useState } from 'react'
import { 
    HeroContainer, 
    HeroBg, 
    ImageBg, 
    HeroContent, 
    HeroH1, 
    HeroP,
    HeroBtnWrapper,
    HeroH2,
    Icon,
    ImageRt,
    HeroText,
    ButtonR,
    ButtonS
} from './HeroElements'
import { Button } from '../ButtonElement'
import Image from '../../../images/background-1.jpg';
import Image2 from '../../../images/banner-area-image.svg';
import { AiOutlineCloudDownload } from 'react-icons/ai'
import { BiChevronRight } from 'react-icons/bi'

const HeroSection = () => {
    const [hover, setHover] = useState(false);

    const onHover = () => {
        setHover(!hover);
    };

    return (
        <HeroContainer id='home'>
            {/* <HeroBg>
                <ImageBg src={Image} />
            </HeroBg> */}
            <HeroContent
            initial = {{opacity: 0}}
            animate = {{opacity: 1}}
            transition = {{duration: 1}}
            >
                <HeroText>
                    <HeroH1>Scientific Data Curation and Sharing Made Easy </HeroH1>
                    {/* <HeroH2></HeroH2> */}
                    <HeroP>
                    </HeroP>
                    <HeroBtnWrapper>
                        <ButtonR to='/documentation'>
                        <Button 
                        onMouseEnter={onHover}
                        onMouseLeave={onHover}>
                            Learn More
                            <Icon>
                                <BiChevronRight />
                            </Icon>
                        </Button>
                        </ButtonR>
                        <ButtonS to='downloads' smooth='true'>
                        <Button
                        onMouseEnter={onHover}
                        onMouseLeave={onHover}>
                            SODA for SPARC
                            <Icon>
                                <AiOutlineCloudDownload />
                            </Icon>
                        </Button>
                        </ButtonS>
                    </HeroBtnWrapper>
                </HeroText>
                <ImageRt src={Image2} />
            </HeroContent>
        </HeroContainer>
    )
}

export default HeroSection
