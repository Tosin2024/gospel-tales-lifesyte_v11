insert into public.quiz_categories(name,description) values
('Old Testament','Stories, people and events from the Old Testament'),
('New Testament','Gospels, Acts and New Testament teaching'),
('Jesus Christ','The life, ministry, teachings, death and resurrection of Jesus'),
('Bible Characters','Major people and lessons from Scripture'),
('Christian Living','Practical discipleship and Christian character')
on conflict(name) do nothing;

insert into public.questions(category_id,difficulty,question_text,option_a,option_b,option_c,option_d,correct_option,explanation,status)
select id,'Beginner','Who built the ark?','Moses','Noah','David','Solomon','B','God instructed Noah to build the ark before the flood.','published'
from public.quiz_categories where name='Old Testament'
and not exists(select 1 from public.questions where question_text='Who built the ark?');

insert into public.questions(category_id,difficulty,question_text,option_a,option_b,option_c,option_d,correct_option,explanation,status)
select id,'Beginner','Where was Jesus born?','Nazareth','Jerusalem','Bethlehem','Capernaum','C','Jesus was born in Bethlehem in Judea.','published'
from public.quiz_categories where name='New Testament'
and not exists(select 1 from public.questions where question_text='Where was Jesus born?');

insert into public.questions(category_id,difficulty,question_text,option_a,option_b,option_c,option_d,correct_option,explanation,status)
select id,'Beginner','Who baptized Jesus?','Peter','John the Baptist','James','Andrew','B','John the Baptist baptized Jesus in the Jordan.','published'
from public.quiz_categories where name='Jesus Christ'
and not exists(select 1 from public.questions where question_text='Who baptized Jesus?');
