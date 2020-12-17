import React from 'react'
import { 
    Nav, 
    NavbarContainer, 
    NavLogo, 
    MobileIcon, 
    NavMenu, 
    NavItem, 
    NavLinks,
    Buttons,
    Icon,
    NavLinksD,
    Button
} from './NavBarElements'
import { FaBars, FaGithub, FaFolderOpen } from 'react-icons/fa'

const Navbar = ({ toggle }) => {
    return (
        <div>
            <Nav>
                <NavbarContainer>
                    <NavLogo to='home' smooth='true'>SODA</NavLogo>
                    <MobileIcon onClick={toggle}>
                        <FaBars />
                    </MobileIcon>
                    <NavMenu>
                        <NavItem>
                            <NavLinks to='about' smooth='true'>About Us</NavLinks>
                        </NavItem>
                        {/* <NavItem>
                            <NavLinksD to='about'>Documentation</NavLinksD>
                        </NavItem> */}
                        <NavItem>
                            <NavLinks to='downloads' smooth='true'>Download SODA</NavLinks>
                        </NavItem>
                        <NavItem>
                            <NavLinks to='features' smooth='true'>Features</NavLinks>
                        </NavItem>
                        <NavItem>
                            <NavLinks to='team' smooth='true'>Our Team</NavLinks>
                        </NavItem>
                    </NavMenu>
                    <Buttons>
                    <NavLinksD>
                    <Button>
                        <Icon>
                            <FaFolderOpen />
                        </Icon>
                        Documentation
                    </Button>
                    </NavLinksD>
                    <Button href="https://github.com/bvhpatel/SODA" target="_blank">
                        <Icon>
                            <FaGithub />
                        </Icon>
                        Github
                    </Button>
                    </Buttons>
                </NavbarContainer>
            </Nav>	
        </div>
    )
}

export default Navbar
 