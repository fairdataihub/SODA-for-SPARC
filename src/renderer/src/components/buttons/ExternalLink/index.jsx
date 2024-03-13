import { Button } from "@mantine/core";
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
      >
        {buttonText}
      </Button>
    </SodaComponentWrapper>
  );
};

export default ExternalLink;
