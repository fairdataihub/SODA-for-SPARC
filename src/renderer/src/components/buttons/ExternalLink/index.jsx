import { Button } from "@mantine/core";
import { IconArrowRight } from "@tabler/icons-react";
import SodaComponentWrapper from "../../utils/SodaComponentWrapper";

const ExternalLink = ({ href, buttonText }) => {
  return (
    <SodaComponentWrapper>
      <Button
        component="a"
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        size="lg"
        radius="md"
        variant="light"
        rightSection={<IconArrowRight size={14} />}
      >
        {buttonText}
      </Button>
    </SodaComponentWrapper>
  );
};

export default ExternalLink;
