import React, { useLayoutEffect, useRef, useState } from 'react'
import { DownloadContainer, DownloadWrapper, Column, Heading, TopLine, SecondLine, Install, Icon, P, PContainer } from './DownloadElements'
import { AiOutlineCloudDownload } from 'react-icons/ai'
import { FaWindows, FaApple, FaLinux } from 'react-icons/fa'

const DownloadSection = ({ id, para1, para2 }) => {

    const [show, doShow] = useState({
        itemOne: false,
        itemTwo: false,
        itemThree: false,
        itemFour: false
      });
      const refOne = useRef(null);
      const refTwo = useRef(null);
      const refThree = useRef(null);
      const refFour = useRef(null);

  useLayoutEffect(() => {
    const topPosition1 = refOne.current.getBoundingClientRect().top;
    const topPosition2 = refTwo.current.getBoundingClientRect().top;
    const topPosition3 = refThree.current.getBoundingClientRect().top;
    const topPosition4 = refFour.current.getBoundingClientRect().top;
    const onScroll = () => {
      const scrollPosition = window.scrollY + window.innerHeight;
     if(topPosition1 < scrollPosition) { 
        doShow(state => ({ ...state, itemOne: true }));
       }
     if (topPosition2 < scrollPosition) {
        doShow(state => ({ ...state, itemTwo: true }));
     }
     if (topPosition3 < scrollPosition) {
        doShow(state => ({ ...state, itemThree: true }));
     }
     if (topPosition4 < scrollPosition) {
        doShow(state => ({ ...state, itemFour: true }));
     }
    };

    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

    return (
        <div>
            <DownloadContainer id={id}>
            <Heading animate={show.itemThree} ref={refThree}>SODA for SPARC</Heading>
            <PContainer animate={show.itemFour} ref={refFour}>
            <P>{para1}</P>
            <P>{para2}</P>
            </PContainer>
            <Heading animate={show.itemOne} ref={refOne}>Download for SPARC</Heading>
                <DownloadWrapper animate={show.itemTwo} ref={refTwo}>
                        <Column>
                            <TopLine>Windows
                                <Icon>
                                    <FaWindows />
                                </Icon>
                            </TopLine>
                            <Install href="https://github.com/bvhpatel/SODA" target="_blank">Windows Installer
                                <Icon>
                                    <AiOutlineCloudDownload />
                                </Icon>
                            </Install>
                        </Column>
                        <Column>
                            <TopLine>MacOS
                                <Icon>
                                    <FaApple />
                                </Icon>
                            </TopLine>
                            <Install href="https://github.com/bvhpatel/SODA" target="_blank">MacOS Installer
                                <Icon>
                                    <AiOutlineCloudDownload />
                                </Icon>
                            </Install>
                        </Column>
                        <Column>
                            <TopLine>Linux
                                <Icon>
                                    <FaLinux />
                                </Icon>
                            </TopLine>
                            <Install href="https://github.com/bvhpatel/SODA" target="_blank">Linux Installer
                                <Icon>
                                    <AiOutlineCloudDownload />
                                </Icon>
                            </Install>
                        </Column>
                </DownloadWrapper>
            </DownloadContainer>
            <hr style={{width: 75+ '%', marginLeft: 12.5 + '%'}} /> 
        </div>
    )
}

export default DownloadSection
