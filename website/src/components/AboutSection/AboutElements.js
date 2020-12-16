import styled from 'styled-components'
import { animate } from 'framer-motion';

export const AboutContainer = styled.div`
    color: #fff;
    background: ${(lightBg) => (lightBg ? '#fff' : '010606')};

    @media screen and (max-width: 816px) {
        padding: 100px 0;
    }
`;

export const AboutWrapper = styled.div`
    opacity: ${({ animate }) => (animate ? '1' : '0')};
    transition: opacity 1s ease-in-out;
    z-index: 1;
    width: 100%;
    height: 860px;
    max-width: 1100px;
    padding: 0px 24px;
    display: grid;
    margin-right: auto;
    margin-left: auto;
    justify-content: center;
`;

export const AboutRow = styled.div`
    display: grid;
    grid-auto-columns: minmax(auto,1fr);
    align-items: center;
    grid-template-areas: ${({imgStart}) => (imgStart ? `'col2 col1'` : `'col1 col2'`)};

    @media screen and (max-width: 818px) {
        grid-template-areas: ${({imgStart}) => (imgStart ? `'col1' 'col2'` : `'col1 col1' 'col2 col2'`)};
    }
`;

export const Column1 = styled.div`
    margin-bottom: 15px;
    padding: 0 15px;
    grid-area: col1;
`;

export const Column2 = styled.div`
    margin-bottom: 15px;
    padding: 0 15px;
    grid-area: col2;
`;

export const TextWrapper = styled.div`
    max-width: 540px;
    padding-top: 0;
    padding-bottom: 60px;
`;

export const TopLine = styled.p`
    color: #01bf71
    font-size: 16x;
    text-transform: uppercase;
    letter-spacing: 1.4px; 
    margin-bottom: 16px;
    line-height: 16px;
    font-weight: 700;
`;

export const Heading =  styled.h1`
    margin-bottom: 24px;
    font-size: 30px;
    line-height: 1.1;
    font-weight: 600;
    color: #000;
`;

export const Description = styled.p`
    margin-bottom: 16px;
    font-size: 16px;
    line-height: 24px;
    max-width: 540px;
    color: grey;
`;

export const ImgWrap =  styled.div`
    max-width: 555px;
    height: 100%
`;

export const Img = styled.img`
    width: 100%;
    margin: 0 0 10px 0;
    padding-right: 0;
`






