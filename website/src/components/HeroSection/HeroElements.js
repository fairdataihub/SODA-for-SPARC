import styled from 'styled-components'
import { motion } from 'framer-motion'

export const HeroContainer = styled.div`
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 0 30px;
    height: 100vh;
    position: relative;
    z-index: 1;
    background-image: linear-gradient(to top, #ddd 0%, #ddd 1%, #fff 100%);
`;

export const HeroBg = styled.div`
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
    width: 100%;
    height: 100%;
    overflow: hidden;
`;

// export const ImageBg = styled.img`
//     width: 100%;
//     height: 100%;
//     -o-object-fit: cover;
//     object-fit: cover;
// `;

export const HeroContent = styled(motion.div)`
    z-index: 3;
    max-width: 1200px;
    position: absolute;
    padding: 8px 24px;
    display: flex;
    align-items: center;

    @media screen and (max-width: 818px) {
        display: flex;
        flex-direction: column;
    }

    @media screen and (max-width: 480px) {
        display: flex;
        flex-direction: column;
    }
`;

export const HeroText = styled.div`
    display: flex;
    flex-direction: column;
    max-width: 50%;

    @media screen and (max-width: 818px) {
        max-width: 100%;
    }

    @media screen and (max-width: 480px) {
        max-width: 100%;
    }
`;

export const HeroH1 = styled.h1`
    color: #000;
    font-size: 54px;
    line-height: 1.1;

    @media screen and (max-width: 818px) {
        font-size: 40px;
    }

    @media screen and (max-width: 480px) {
        font-size: 32px;
    }
`;

// export const HeroH2 = styled.h2`
//     font-size: 24x;
//     font-weight: 400;
//     // text-transform: uppercase;
//     // letter-spacing: 8px; 

//     @media screen and (max-width: 818px) {
//         font-size: 24px;
//     }

//     @media screen and (max-width: 480px) {
//         font-size: 18px;
//     }
// `;

export const HeroP = styled.p`
    margin-top: 24px;
    font-size: 14px;
    text-align: left;
    max-width: 500px;
    line-height: 31.5px;
    font-weight: 400;

    @media screen and (max-width: 818px) {
        font-size: 14px;
    }

    @media screen and (max-width: 480px) {
        font-size: 14px;
    }
`;

export const HeroBtnWrapper = styled.div`
    margin-top: 32px;
    display: flex;
    flex-direction: row;
    align-items: center;
    // margin-right: auto;
`;

export const Icon = styled.div`
    align-items: center;
    padding-left: 1rem;
    font-size: 1.8rem;
    display: flex;
`;

export const ImageRt = styled.img`
    width: 50%;
    height: auto;

    @media screen and (max-width: 818px) {
        display: none;
    }
`;