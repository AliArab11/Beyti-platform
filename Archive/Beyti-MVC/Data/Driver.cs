using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace Beyti.Data;

[Table("Driver")]
[Index("UserProfileId", Name = "IX_Driver_UserProfile")]
[Index("UserProfileId", Name = "UQ__Driver__9E267F63FDEE39CB", IsUnique = true)]
public partial class Driver
{
    [Key]
    public int Id { get; set; }

    public int UserProfileId { get; set; }

    [StringLength(30)]
    public string Phone { get; set; } = null!;

    [StringLength(20)]
    public string Status { get; set; } = null!;

    [Precision(3)]
    public DateTime CreatedAt { get; set; }

    [Precision(3)]
    public DateTime UpdatedAt { get; set; }

    [InverseProperty("Driver")]
    public virtual ICollection<DeliveryTicket> DeliveryTickets { get; set; } = new List<DeliveryTicket>();

    [ForeignKey("UserProfileId")]
    [InverseProperty("Driver")]
    public virtual UserProfile UserProfile { get; set; } = null!;
}
