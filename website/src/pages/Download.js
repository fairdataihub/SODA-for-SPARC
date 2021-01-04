import React, { useState } from 'react'
import Sidebar from '../components/documentation/Sidebar/Sidebar'
import SidebarRes from '../components/documentation/SidebarResponsive/SidebarRes'
import { Article, ArticleTitle, ArticleSubTitle, ArticleP, Section,Scroll, ScrollTitle, ScrollSubTitle, ScrollContainer, Page } from '../components/documentation/ArticleElements'
import styled from 'styled-components'

export const List = styled.ul`
    margin-top: 25px;
    padding-left: 5.6%;
    list-style-type: decimal;
    width: 100%;
`;
export const ListItem = styled.li`
    margin: 10px 0;
`;

export const Link = styled.a`
    color: #0077ff;
    cursor: pointer;
    text-decoration: none;

    &:hover {
        text-decoration: underline;
    }
`;

const Download = () => {
    const [isOpen, setIsOpen] = useState(false)

    const toggle = () => {
        setIsOpen(!isOpen)
    };
    return (
        <div>
            <SidebarRes isOpen={isOpen} toggle={toggle} />
            <Sidebar toggle={toggle}/>
            <Page
            initial = {{opacity: 0}}
            animate = {{opacity: 1}}
            transition = {{duration: 1}}> 
            <Article>
                <ArticleTitle>Download and Open the Application</ArticleTitle>
                <ArticleP>To use SODA, first download and install the <Link href='https://developer.blackfynn.io/agent/index.html' target='_blank'>Blackfynn agent</Link>. Then, follow the instructions below for your specific platform:</ArticleP>
                <Section className='windows'>
                <ArticleSubTitle>Windows (developed and tested on Windows 10)</ArticleSubTitle>
                <List>
                    <ListItem>Download the <Link href='https://github.com/bvhpatel/SODA/wiki/Download' target='_blank'>Windows Installer</Link>.</ListItem>
                    <ListItem>Double click on the installer (.exe file), it will start the installation process (if there is a permission issue try right click and select "Run as administrator").</ListItem>
                    <ListItem>Follow the installation instructions.</ListItem>
                    <ListItem>Once the application is installed, you can run the application by either running the desktop shortcut, searching for "SODA" on the start menu, or from the installation folder.</ListItem>
                    <ListItem>To stop the application, simply click on the cross in the top right corner.</ListItem>
                </List>
                <ArticleP>The downloaded installer file could be deleted since it is not necessary to run SODA. The SODA app can be uninstalled from the Program manager (under Control Panel) as any other app on Windows.</ArticleP>
                </Section>

                <Section className='macos'>
                <ArticleSubTitle>macOS (developed and tested on macOS Catalina 10.15)</ArticleSubTitle>
                <List>
                    <ListItem>Download the <Link href='https://github.com/bvhpatel/SODA/wiki/Download' target='_blank'>MacOs Installer</Link>.</ListItem>
                    <ListItem>Double-click on the installer (.dmg file) and, in the installation window, drag the SODA icon into the "Applications" folder. Security preferences may need to be changed (System Preferences {'>'} Security and Privacy {'>'} General Tab {'>'} "Open anyway").</ListItem>
                    <ListItem>To stop the application, click on the red circle/button in the top left corner.</ListItem>
                </List>
                <ArticleP>The downloaded installer could be deleted since it is not necessary to run SODA. To uninstall the SODA app, simply delete it from your computer’s "Applications" folder.</ArticleP>
                </Section>

                <Section className='linux'>
                <ArticleSubTitle>Ubuntu (developed and tested on Ubuntu 18.04.5 LTS)</ArticleSubTitle>
                <List>
                    <ListItem>Download <Link href='https://github.com/bvhpatel/SODA/wiki/Download' target='_blank'>Linux Appimage</Link>.</ListItem>
                    <ListItem>Right click on the downloaded file and go to the permissions tab.</ListItem>
                    <ListItem>Click the 'Allow executing file as program' and make sure it has a checkmark.</ListItem>
                    <ListItem>Double click the downloaded SODA app icon and it should open the app.</ListItem>
                    <ListItem>To stop the application click on the red circle/button in the top left corner.</ListItem>
                </List>
                <ArticleP>Since our Linux SODA app is in the AppImage format, you can move this file to anywhere on your computer and run it. If you would like to move the app into the applications folder, we recommend you use the open source <Link href='https://github.com/TheAssassin/AppImageLauncher' target='_blank'>Appimage Launcher</Link> to organize and handle all AppImage programs for your Linux system.</ArticleP>
                </Section>

                <Section className='notes'>
                    <ArticleSubTitle>Notes</ArticleSubTitle>
                    <ArticleP>SODA may work on OS versions other than those mentioned above but it hasn't been tested.</ArticleP>
                </Section>

            </Article>
            <ScrollContainer>
            <Scroll>
                <ScrollTitle>In this article</ScrollTitle>
                <ScrollSubTitle to='windows' smooth='true'>Windows (developed and tested on Windows 10)</ScrollSubTitle>
                <ScrollSubTitle to='macos' smooth='true'>macOS (developed and tested on macOS Catalina 10.15)</ScrollSubTitle>
                <ScrollSubTitle to='linux' smooth='true'>Ubuntu (developed and tested on Ubuntu 18.04.5 LTS)</ScrollSubTitle>
                <ScrollSubTitle to='notes' smooth='true'>Notes</ScrollSubTitle>
            </Scroll>
            </ScrollContainer>
            </Page>
        </div>
    )
}

export default Download