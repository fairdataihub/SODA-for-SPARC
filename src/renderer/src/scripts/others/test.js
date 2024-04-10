let str = "Hello<br>World<br>How are you?";
let replacement = "Replacement string<br>";

// Replace everything up to and including the second <br>
str = str.replace(/(.*?<br>.*?)(<br>)/, replacement);

console.log(str); // Outputs: Replacement stringHow are you?
