import styled from 'styled-components'
import { Link } from 'react-scroll'
import { motion } from 'framer-motion'

export const Article = styled.div`
    max-width: 1000px;
    padding: 0 50px;
    margin-top: 150px;
    grid-area: col1;

    @media screen and (max-width: 1250px) {
        margin-top: 50px;
    }

    @media screen and (max-width: 1000px) {
        margin-top: 150px;
    }

    @media screen and (max-width: 750px) {
        margin-top: 50px;
    }
`;

export const ArticleTitle = styled.div`
    font-size: 48px;
    font-weight: 600;
    width: 100%;
`;

export const ArticleSubTitle = styled.div`
    margin-top: 25px;
    font-size: 32px;
    font-weight: 600;
    width: 100%;
`;

export const ArticleP = styled.p`
    margin-top: 25px;
    width: 100%;
`;

export const Section = styled.div`
    margin-bottom: 50px;
    width: 100%;
    align-items: center;
    display: flex;
    justify-content: center;
    flex-direction: column;

    // &:before {
    //     content:"";
    //     display: block;
    //     height: 100px;
    //     margin:-100px 0 0;
    // }
`;

export const ScrollContainer = styled.div`
    max-width: 350px;
    margin-top: 100px;
    padding-right: 50px;
    grid-area: col2;
    align-self: start;
    justify-self: start;

    @media screen and (max-width: 1250px) {
        padding-left: 50px;
        max-width: 100%;
    }

    @media screen and (max-width: 1000px) {
        padding-left: 0px;
        max-width: 350px;
    }

    @media screen and (max-width: 750px) {
        padding-left: 50px;
        max-width: 100%;
    }
`;

export const Scroll = styled.div`
    display: flex;
    flex-direction: column;
`;

export const ScrollTitle = styled.div`
    font-weight: 600;
    width: 100%;
    padding-bottom: 5px;
`;

export const ScrollSubTitle = styled(Link)`
    padding: 5px 0;
    color: #0077ff;
    cursor: pointer;
    text-decoration: none;
    width: 100%;

    &:hover {
        text-decoration: underline;
    }
`;

export const Page = styled(motion.div)`
    max-width: 1350px;
    margin-left: 300px;
    display: grid;
    // grid-auto-columns: 1fr;
    align-items: center;
    grid-template-areas: 'col1 col2';

    @media screen and (max-width: 1250px) {
        grid-template-areas: 'col2' 'col1';
    }

    @media screen and (max-width: 1000px) {
        grid-template-areas: 'col1 col2';
        margin: auto;
    }

    @media screen and (max-width: 750px) {
        grid-template-areas: 'col2' 'col1';
    }
`;