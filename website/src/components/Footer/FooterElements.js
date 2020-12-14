import styled from 'styled-components'

export const FooterContainer = styled.div`
    background: #000;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;
`

export const SocialMedia = styled.div`
    color: #fff;
    display: flex;
    max-width: 500px;
    height: 8vh;
`;

export const Icon = styled.a`
    align-items: center;
    padding: 0 2rem;
    font-size: 1.8rem;
    display: flex;
    cursor: pointer;
    text-decoration: none;
    color: #fff;

    @media screen and (max-width: 818px) {
        font-size: 1.6rem;
        padding: 0 1.5rem;
    }

    @media screen and (max-width: 500px) {
        font-size: 1.4rem;
        padding: 0 1rem;
    }
`;

export const Contact = styled.div`
    padding-top: 50px;
    color: #fff;
    font-size: 40px;
    font-weight: 700;
    display: flex;

    @media screen and (max-width: 818px) {
        font-size: 32px;
    }

    @media screen and (max-width: 500px) {
        font-size: 24px;
    }
`
export const ContactLink = styled.a`
    padding-left: 10px;
    cursor: pointer;
    text-decoration: none;
    color: #fff;

    &:hover {
        color: #b80d49;
    }
`

export const Contact1 = styled.div`
    padding-top: 20px;
    color: #fff;
    font-size: 20px;
    font-weight: 400;
    text-align: center;

    @media screen and (max-width: 818px) {
        font-size: 16px;
    }

    @media screen and (max-width: 500px) {
        font-size: 16px;
    }
`

export const Copyright = styled.div`
    padding-top: 60px;
    color: #fff;
    font-size: 14px;
    padding-bottom: 20px;
`