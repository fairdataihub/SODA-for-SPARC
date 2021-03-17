import styled from 'styled-components'

export const FeatureContainer = styled.div`
    // height: 1060px;
    display: flex;
    flex-direction: column;
    align-items: center;
    background: white;
    justify-content: center;
    padding: 100px 0;

    // @media screen and (max-width: 1000px) {
    //     height: 2000px;
    // }
`;

export const Heading =  styled.h1`
    opacity: ${({ animate }) => (animate ? '1' : '0')};
    transition: opacity 1s ease-in-out;
    margin-bottom: 50px;
    font-size: 40px;
    line-height: 1.1;
    font-weight: 600;
    color: #000;
`;

export const Intro = styled.p`
    opacity: ${({ animate }) => (animate ? '1' : '0')};
    transition: opacity 1s ease-in-out;
    max-width: 1000px;
    padding-bottom: 70px;
    text-align: center;
    padding-left: 50px;
    padding-right: 50px;
`

export const FeatureRow = styled.div`
    opacity: ${({ animate }) => (animate ? '1' : '0')};
    transition: opacity 1s ease-in-out;
    max-width: 1000px;
    margin: 0 auto;
    display: grid;
    align-items: center;
    padding: 0 50px;
    grid-gap: 50px;
    grid-template-columns: 1fr 1fr 1fr;

    @media screen and (max-width: 1000px) {
        grid-template-columns: 1fr;
        padding: 0 20px;
    }
`;

export const Column = styled.div`
    display: flex;
    flex-direction: column;
    max-width: 300px;
`;

export const FeatureTitle = styled.p`
    padding-bottom: 20px;
    color: #000;
    font-size: 24px;
    font-weight: 600;
    display: flex;
`;

export const Feature = styled.p`
    padding-bottom: 40px;
    font-size: 16px;
    color: grey;
`;

export const Icon = styled.div`
    align-items: center;
    padding-right: 1rem;
    font-size: 1.8rem;
    display: flex;
`;

export const Img = styled.img`
    width: 300px;
    height: auto;
`;


