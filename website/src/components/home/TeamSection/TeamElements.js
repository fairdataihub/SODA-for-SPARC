import styled from 'styled-components'

export const TeamContainer = styled.div`
    height: 800px;
    display: flex;
    flex-direction: column;
    align-items: center;
    background: white;
    justify-content: center;

    @media screen and (max-width: 1000px) {
        height: 1800px;
    }
`;

export const Heading =  styled.h1`
    opacity: ${({ animate }) => (animate ? '1' : '0')};
    transition: opacity 1s ease-in-out;
    margin-bottom: 100px;
    font-size: 40px;
    line-height: 1.1;
    font-weight: 600;
    color: #000;
`;

export const TeamRow = styled.div`
    opacity: ${({ animate }) => (animate ? '1' : '0')};
    transition: opacity 1s ease-in-out;
    max-width: 1300px;
    margin: 0 auto;
    display: grid;
    align-items: center;
    padding: 0 50px;
    grid-gap: 150px;
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
    align-items: center;
`;

export const Title = styled.p`
    padding-bottom: 10px;
    padding-top: 5vh;
    color: #000;
    font-size: 20px;
    text-align: center;
`;

export const Desc = styled.p`
    padding-bottom: 20px;
    font-size: 20px;
    color: grey;
    text-align: center;
`;

export const Img = styled.img`
    max-width: 200px;
    box-shadow: 0 0 5px rgba(128, 128, 128);
    border-radius: 50%;
`;


