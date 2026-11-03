'use client';

import { useState } from 'react';
import { GroupWorkspace } from '@/components/GroupWorkspace';
import type { Assignment, GroupDashboard, GroupInput, ShirtSize } from '@/lib/types';

const names = ['Alex Rivera', 'Jamie Park', 'Taylor Chen', 'Jordan Lee', 'Casey Morgan', 'Sam Patel', 'Drew Wilson', 'Riley Kim', 'Morgan Flores', 'Avery Scott'];
const members = names.map((name,i)=>({user_id:`demo-${i}`,display_name:name,is_me:i===0,is_organizer:i===0,size_submitted:true,joined_at:new Date(1700000000000 + i*1000).toISOString()}));
const defaultGroup: GroupDashboard = {
  id:'demo-group', name:'Afterglow Crew',concert_name:'Electric Skyline Festival',venue:'The Main Stage',
  concert_date: '2027-04-10',expected_members:10,joined_count:10,sizes_ready:10,drawn_at:null,
  is_organizer:true,invite_code:'demo-invite',my_size:'L',members,
};

export default function DemoPage() {
  const [group,setGroup] = useState<GroupDashboard>(defaultGroup);
  const [assignment,setAssignment] = useState<Assignment>({recipient_name:'Taylor Chen',recipient_size:'M',draw_version:1});
  return <GroupWorkspace demo group={group}
    onSaveSize={async(size:ShirtSize)=>setGroup(p=>({...p,my_size:size}))}
    onGenerate={async()=>{setGroup(p=>({...p,drawn_at:new Date().toISOString()}));}}
    onReset={async()=>{setGroup(p=>({...p,drawn_at:null}));}}
    onUpdate={async(input:GroupInput)=>{if(input.expected_members<group.joined_count) throw new Error('Cannot reduce group size below the number of registered members.');if(group.drawn_at && input.expected_members!==group.expected_members) throw new Error('Reset the draw before changing group size.');setGroup(p=>({...p,...input}));}}
    onRemove={async(userId:string)=>{setGroup(p=>({...p,members:p.members.filter(m=>m.user_id!==userId),joined_count:p.joined_count-1,sizes_ready:p.sizes_ready-1}));}}
    onReveal={async()=>assignment}
  />;
}
