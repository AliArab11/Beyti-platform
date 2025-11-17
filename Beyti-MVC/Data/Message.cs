using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace Beyti.Data;

[Table("Message")]
[Index("RecipientUserId", "IsRead", Name = "IX_Message_Recipient_Read")]
[Index("SenderUserId", Name = "IX_Message_Sender")]
public partial class Message
{
    [Key]
    public int Id { get; set; }

    public int SenderUserId { get; set; }

    public int RecipientUserId { get; set; }

    public string Content { get; set; } = null!;

    public bool IsRead { get; set; }

    [Precision(3)]
    public DateTime CreatedAt { get; set; }

    [ForeignKey("RecipientUserId")]
    [InverseProperty("MessageRecipientUsers")]
    public virtual UserProfile RecipientUser { get; set; } = null!;

    [ForeignKey("SenderUserId")]
    [InverseProperty("MessageSenderUsers")]
    public virtual UserProfile SenderUser { get; set; } = null!;
}
