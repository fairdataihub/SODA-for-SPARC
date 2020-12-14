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
    HeroText
} from './HeroElements'
import { Button } from '../ButtonElement'
import Image from '../../images/background-1.jpg';
import Image2 from '../../images/banner.svg';
import { AiOutlineCloudDownload } from 'react-icons/ai'

const HeroSection = () => {
    const [hover, setHover] = useState(false);

    const onHover = () => {
        setHover(!hover);
    };

    return (
        <HeroContainer id='home'>
            <HeroBg>
                <ImageBg src={Image} />
            </HeroBg>
            <HeroContent
            initial = {{opacity: 0}}
            animate = {{opacity: 1}}
            transition = {{duration: 1}}
            >
                <HeroText>
                    <HeroH1>SODA</HeroH1>
                    <HeroH2>Keep Calm and Curate</HeroH2>
                    <HeroP>
                        Your one-stop tool for curating and submitting SPARC datasets by SPARC investigators, for SPARC investigators.
                    </HeroP>
                    <HeroBtnWrapper>
                        <Button 
                        to='downloads'
                        onMouseEnter={onHover}
                        onMouseLeave={onHover}
                        big='true'
                        fontBig='true'
                        smooth='true'>
                            Download
                            <Icon>
                                <AiOutlineCloudDownload />
                            </Icon>
                        </Button>
                    </HeroBtnWrapper>
                </HeroText>
                <ImageRt src={Image2} />
            </HeroContent>
        </HeroContainer>
    )
}

export default HeroSection
