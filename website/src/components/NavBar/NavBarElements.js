import styled from 'styled-components'
import { Link as LinkR } from 'react-router-dom'
import { Link as LinkS} from 'react-scroll'

export const Nav = styled.nav`
    background: #000;
    height: 7vh;
    display: flex;
    justify-content: center;
    align-items: center;
    font-size: 1rem;
    position: fixed;
    top: 0;
    z-index: 10;
    width: 100%;

    @media screen and (max-width: 960px) {
        transition: 0.8s all ease;
    }
`;

export const NavbarContainer = styled.div`
    height: 80px;
    display: flex;
    // justify-content: space-between;
    z-index: 1;
    width: 100%;
    padding: 0 24px;
    max-width: 1100px;
`;

export const NavLogo = styled(LinkS)`
    color: #20b2aa;
    justify-self: flex-start;
    cursor: pointer;
    font-size: 1.5rem;
    display: flex;
    align-items: center;
    margin-left: 24px;
    font-weight: bold;
    text-decoration: none;
`;

export const MobileIcon = styled.div`
    display: none;

    @media screen and (max-width: 1000px) {
        display: block;
        position: absolute;
        top: 0;
        right: 0;
        transform: translate(-100%, 50%);
        font-size: 1.8rem;
        cursor: pointer;
        color: #fff;
    }
`;

export const NavMenu = styled.ul`
    display: flex;
    align-items: center;
    list-style: none;
    text-align: center;
    margin-left: 30px;

    @media screen and (max-width: 1000px) {
        display: none;
    }
`;

export const NavItem = styled.li`
    height: 7vh;
`

export const NavLinks = styled(LinkS)`
    color: #fff;
    display: flex;
    align-items: center;
    text-decoration; none;
    padding: 0 1rem;
    height: 100%;
    cursor: pointer;

    // &:hover {
    //     // background: #202020;
    //     border-bottom: 4px solid #20b2aa;
    //     cursor: pointer;
    // }
`;

export const NavLinksD = styled(LinkR)`
    // color: #fff;
    // display: flex;
    // align-items: center;
    // padding: 0 1rem;
    // height: 100%;
    // cursor: pointer;
    text-decoration: none;
`;

export const Buttons = styled.div`
    display: flex;
    align-items: center;
    margin-left: auto; 

    @media screen and (max-width: 1000px) {
        display: none;
    }
`;

export const Icon = styled.div`
    align-items: center;
    padding-right: 10px;
    font-size: 1rem;
    cursor: pointer;
    display: flex;
`

export const Button = styled.a`
    border-radius: 50px;
    background: tranparent;
    padding: 10px 10px;
    color: #fff;
    border: 2px solid white;
    cursor: pointer;
    display: flex;
    justify-content: center;
    align-items: center;
    text-decoration: none;
    margin-left: 10px;

    &:hover {
        transition: all 0.2s ease-in-out;
        color: #e0e0e0;
        border: 2px solid #e0e0e0;
    }
`