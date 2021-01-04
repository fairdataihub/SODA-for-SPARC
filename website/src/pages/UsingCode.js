import React, { useState } from 'react'
import Sidebar from '../components/documentation/Sidebar/Sidebar'
import SidebarRes from '../components/documentation/SidebarResponsive/SidebarRes'
import { Article, ArticleTitle, ArticleSubTitle, Section, Scroll, ScrollTitle, ScrollSubTitle, ArticleP, Page, ScrollContainer } from '../components/documentation/ArticleElements'
import styled from 'styled-components'

export const Image = styled.img`
    max-width: 700px;
    margin-top: 25px;
    border: none;
`;

export const List = styled.ul`
    padding-left: 5.6%;
    width: 100%;
`;
export const ListItem = styled.li`
    margin: 10px 0;
`;

export const H = styled.div`
    font-size: 24px;
    font-weight: 500;
    width: 100%;
    margin-top: 25px;
`;

export const Link = styled.a`
    color: #0077ff;
    cursor: pointer;
    text-decoration: none;

    &:hover {
        text-decoration: underline;
    }
`;

export const Code = styled.div`
    margin-top: 15px;
    padding: 15px 15px;
    background: #ddd;
    width: 100%;
    border-radius: 5px;
    font-family: Menlo;
`;

export const CodeShort = styled.div`
    // margin-top: 15px;
    padding: 2px 5px;
    background: #ddd;
    // width: 100%;
    border-radius: 5px;
    font-family: Menlo;
    display: inline-block;
    font-size: 14px;
`;

const SourceCode = () => {
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
                <ArticleTitle>Using the Source Code</ArticleTitle>
                <ArticleP>The front-end (Graphical User Interface or GUI) of SODA is built with <Link>Electron</Link>, an open-source framework developed and maintained by GitHub that conveniently combines Node.js, HTML, CSS, and Javascript, while the back-end is developed in Python (v3.6). The application is inspired by a <Link>GitHub repository</Link> and a <Link>Medium blog</Link>. All source codes and files are shared with an open source license (<Link>MIT</Link>) to permit user modification without restrictions. Folder structure for the source code is based on the Electron standards and similar to the <Link>Electron Demo Application</Link>.</ArticleP>
                <ArticleP style={{fontStyle: 'italic', marginBottom: 10+'px'}}><strong>Pre-requisites: <Link>Anaconda (Python 3 version)</Link>, <Link>Python 2</Link></strong></ArticleP>
                <Section className='one'>
                <H>Download source code from the GitHub repository</H>
                <ArticleP>Either download the zip folder from the GitHub repository or run the following command from your bash shell.</ArticleP>
                <Code>git clone https://github.com/bvhpatel/SODA.git</Code>
                </Section>
                <Section className='two'>
                <H>Install C++ development libraries – <Link>https://www.npmjs.com/package/node-gyp</Link></H>
                <ArticleP style={{fontStyle: 'italic'}}><strong>Windows</strong></ArticleP>
                <List>
                    <ListItem>Download <Link>Visual Studio 2017</Link>, run the executable file.</ListItem>
                    <ListItem>In the installer, select “Desktop development with C++” and check “VC++ 2015.3 v14.00”.</ListItem>
                </List>
                <ArticleP style={{fontStyle: 'italic'}}><strong>Mac</strong></ArticleP>
                <List>
                    <ListItem>Install <Link>Xcode</Link>.</ListItem>
                    <ListItem>Run: <CodeShort>brew install gcc</CodeShort></ListItem>
                    <p style={{fontStyle: 'italic', width: 100 +'%'}}>Refer here for installing 'brew' if your Mac doesn't already have it – <Link>https://docs.brew.sh/Installation</Link></p>
                </List>
                <ArticleP style={{fontStyle: 'italic'}}><strong>Linux</strong></ArticleP>
                <List>
                    <ListItem><Link>Install GCC</Link> on Ubuntu.</ListItem>
                </List>
                </Section>
                <Section className='three'>
                <H>Setting up the development environment</H>
                <List>
                    <ListItem>Create conda environment from YML file – <Link>Managing conda environment</Link>.<br/>
                    (If “pip returned an error”, then activate the half-completed conda environment and manually install libraries using --user argument in pip (eg.- “pip install zerorpc –user”)</ListItem>
                    <ListItem>Activate the conda environment (If you're on Windows, use 'Anaconda Prompt') and navigate to the 'src' folder.</ListItem>
                    <ListItem>Delete 'node_modules' folder and package-lock.json (if present).</ListItem>
                    <ListItem>Run the following commands:</ListItem>
                    <Code>
                    $ sudo npm install -g node-gyp<br/>
                    $ npm config set python \path\to\python2.exe<br/>
                    $ npm config set msvs_version 2017<br/>
                    $ npm install<br/>
                    $ "./node_modules/.bin/"electron-rebuild .<br/>
                    $ npm start<br/>
                    </Code>
                    <p>Note: if electron-rebuild . gives an error, try deleting the .electron-gyp folder from your user profile and try again.</p>
                    <ListItem>This should launch the application. You can now edit the code files in 'src' folder and run <CodeShort>npm start</CodeShort> to see / test your changes.</ListItem>
                </List>
                </Section>
            </Article>
            <ScrollContainer>
            <Scroll>
                <ScrollTitle>In this article</ScrollTitle>
                <ScrollSubTitle to='one' smooth='true'>Download source code from the GitHub repository</ScrollSubTitle>
                <ScrollSubTitle to='two' smooth='true'>Install C++ development libraries</ScrollSubTitle>
                <ScrollSubTitle to='three' smooth='true'>Setting up the development environment</ScrollSubTitle>
            </Scroll>
            </ScrollContainer>
            </Page>
        </div>
    )
}

export default SourceCode
