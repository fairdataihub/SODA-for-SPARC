import styled from 'styled-components'

export const DownloadContainer = styled.div`
    height: 660px;
    display: flex;
    flex-direction: column;
    align-items: center;
    background: #20b2aa;
    justify-content: center;

    @media screen and (max-width: 1000px) {
        height: 1300px;
    }

    // @media screen and (max-width: 700px) {
    //     height: 1300px;
    // }
`;

export const Heading =  styled.h1`
    opacity: ${({ animate }) => (animate ? '1' : '0')};
    transition: opacity 1s ease-in-out;
    margin-bottom: 100px;
    font-size: 40px;
    line-height: 1.1;
    font-weight: 600;
    color: #fff;
`;

export const DownloadWrapper = styled.div`
    opacity: ${({ animate }) => (animate ? '1' : '0')};
    transition: opacity 1s ease-in-out;
    max-width: 1000px;
    margin: 0 auto;
    display: grid;
    align-items: center;
    padding: 0 50px;
    grid-template-columns: 1fr 1fr 1fr;

    // @media screen and (max-width: 1000px) {
    //     grid-template-columns: 1fr 1fr;
    // }

    @media screen and (max-width: 1000px) {
        grid-template-columns: 1fr;
        padding: 0 20px;
        grid-gap: 150px;
    }
`;

export const Column = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 300px;
`;

export const TopLine = styled.p`
    padding-bottom: 50px;
    color: #fff;
    font-size: 30px;
    font-weight: 600;
    display: flex;
`;

// export const SecondLine = styled.p`
//     padding-bottom: 15px;
//     font-size: 20px;
//     color: white;
// `;

export const Install = styled.a`
    color: white;
    font-size: 20px;
    display: flex;
    cursor: pointer;
    text-decoration: none;

    &:hover {
        color: #b80d49;
    }
`;

export const Icon = styled.div`
    align-items: center;
    padding-left: 1rem;
    font-size: 1.8rem;
    display: flex;
`;


